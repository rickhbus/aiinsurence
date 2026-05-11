import Foundation
import HealthKit
import UIKit

struct MobileHealthRecord: Encodable {
    let type: String
    let sourceRecordId: String?
    let startTime: String
    let endTime: String?
    let value: Double?
    let unit: String?
    let workoutType: String?
    let durationSeconds: Int?
    let distanceKm: Double?
    let calories: Int?
    let averageHeartRateBpm: Int?
    let minHeartRateBpm: Int?
    let maxHeartRateBpm: Int?
    let label: String?
}

struct MobileHealthSyncPayload: Encodable {
    let sourcePlatform = "apple_healthkit"
    let sourceDevice: String?
    let idempotencyKey: String
    let consentGranted: Bool
    let records: [MobileHealthRecord]
}

final class MobileHealthSyncClient {
    private let baseURL: URL

    init(baseURL: URL) {
        self.baseURL = baseURL
    }

    func sync(payload: MobileHealthSyncPayload, bearerToken: String) async throws -> (Data, HTTPURLResponse) {
        var request = URLRequest(url: baseURL.appending(path: "/api/mobile-health/sync"))
        request.httpMethod = "POST"
        request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder.mobileHealthEncoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        return (data, httpResponse)
    }
}

final class HealthKitMobileHealthBridge {
    private let store = HKHealthStore()
    private let calendar = Calendar(identifier: .gregorian)

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestReadPermission() async throws {
        let types = Set([
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            HKQuantityType.quantityType(forIdentifier: .bodyMass),
            HKQuantityType.quantityType(forIdentifier: .heartRate),
            HKObjectType.workoutType(),
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis),
            HKObjectType.categoryType(forIdentifier: .mindfulSession)
        ].compactMap { $0 })

        try await store.requestAuthorization(toShare: [], read: types)
    }

    func buildPayload(daysBack: Int, consentGranted: Bool) async throws -> MobileHealthSyncPayload {
        let end = Date()
        let start = calendar.date(byAdding: .day, value: -max(1, min(daysBack, 30)), to: end) ?? end
        let sourceDevice = UIDevice.current.model

        async let steps = quantitySum(.stepCount, type: "steps", unit: .count(), start: start, end: end)
        async let energy = quantitySum(.activeEnergyBurned, type: "active_energy", unit: .kilocalorie(), start: start, end: end)
        async let bodyMass = latestQuantity(.bodyMass, type: "body_weight", unit: .gramUnit(with: .kilo), start: start, end: end)
        async let workouts = workoutSummaries(start: start, end: end)
        async let sleep = sleepSummaries(start: start, end: end)
        async let heartRate = heartRateSummary(start: start, end: end)

        let records = try await (steps + energy + bodyMass + workouts + sleep + heartRate)

        return MobileHealthSyncPayload(
            sourceDevice: sourceDevice,
            idempotencyKey: "ios-\(Int(end.timeIntervalSince1970))-\(UUID().uuidString)",
            consentGranted: consentGranted,
            records: Array(records.prefix(100))
        )
    }

    private func quantitySum(
        _ identifier: HKQuantityTypeIdentifier,
        type: String,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> [MobileHealthRecord] {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            return []
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKStatisticsQueryDescriptor(
            predicate: HKSamplePredicate.quantitySample(type: quantityType, predicate: predicate),
            options: .cumulativeSum
        )
        let statistics = try await descriptor.result(for: store)
        guard let value = statistics.sumQuantity()?.doubleValue(for: unit), value > 0 else {
            return []
        }

        return [MobileHealthRecord(
            type: type,
            sourceRecordId: nil,
            startTime: ISO8601DateFormatter.mobileHealth.string(from: start),
            endTime: ISO8601DateFormatter.mobileHealth.string(from: end),
            value: value,
            unit: type == "steps" ? "count" : "kcal",
            workoutType: nil,
            durationSeconds: nil,
            distanceKm: nil,
            calories: nil,
            averageHeartRateBpm: nil,
            minHeartRateBpm: nil,
            maxHeartRateBpm: nil,
            label: nil
        )]
    }

    private func latestQuantity(
        _ identifier: HKQuantityTypeIdentifier,
        type: String,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> [MobileHealthRecord] {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            return []
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: quantityType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.endDate, order: .reverse)],
            limit: 1
        )
        guard let sample = try await descriptor.result(for: store).first else {
            return []
        }

        return [MobileHealthRecord(
            type: type,
            sourceRecordId: sample.uuid.uuidString,
            startTime: ISO8601DateFormatter.mobileHealth.string(from: sample.startDate),
            endTime: ISO8601DateFormatter.mobileHealth.string(from: sample.endDate),
            value: sample.quantity.doubleValue(for: unit),
            unit: "kg",
            workoutType: nil,
            durationSeconds: nil,
            distanceKm: nil,
            calories: nil,
            averageHeartRateBpm: nil,
            minHeartRateBpm: nil,
            maxHeartRateBpm: nil,
            label: nil
        )]
    }

    private func workoutSummaries(start: Date, end: Date) async throws -> [MobileHealthRecord] {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.workout(predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)],
            limit: 50
        )

        return try await descriptor.result(for: store).map { workout in
            MobileHealthRecord(
                type: "workout",
                sourceRecordId: workout.uuid.uuidString,
                startTime: ISO8601DateFormatter.mobileHealth.string(from: workout.startDate),
                endTime: ISO8601DateFormatter.mobileHealth.string(from: workout.endDate),
                value: nil,
                unit: nil,
                workoutType: workout.workoutActivityType == .running ? "run" : "other",
                durationSeconds: Int(workout.duration),
                distanceKm: workout.totalDistance?.doubleValue(for: .meter()).map { $0 / 1000 },
                calories: workout.totalEnergyBurned.map { Int($0.doubleValue(for: .kilocalorie())) },
                averageHeartRateBpm: nil,
                minHeartRateBpm: nil,
                maxHeartRateBpm: nil,
                label: nil
            )
        }
    }

    private func sleepSummaries(start: Date, end: Date) async throws -> [MobileHealthRecord] {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            return []
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\.startDate)],
            limit: 50
        )

        return try await descriptor.result(for: store).map { sample in
            MobileHealthRecord(
                type: "sleep_session",
                sourceRecordId: sample.uuid.uuidString,
                startTime: ISO8601DateFormatter.mobileHealth.string(from: sample.startDate),
                endTime: ISO8601DateFormatter.mobileHealth.string(from: sample.endDate),
                value: nil,
                unit: nil,
                workoutType: nil,
                durationSeconds: Int(sample.endDate.timeIntervalSince(sample.startDate)),
                distanceKm: nil,
                calories: nil,
                averageHeartRateBpm: nil,
                minHeartRateBpm: nil,
                maxHeartRateBpm: nil,
                label: nil
            )
        }
    }

    private func heartRateSummary(start: Date, end: Date) async throws -> [MobileHealthRecord] {
        guard let heartType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            return []
        }

        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let descriptor = HKStatisticsQueryDescriptor(
            predicate: HKSamplePredicate.quantitySample(type: heartType, predicate: predicate),
            options: [.discreteAverage, .discreteMin, .discreteMax]
        )
        let statistics = try await descriptor.result(for: store)
        let unit = HKUnit.count().unitDivided(by: .minute())

        guard let average = statistics.averageQuantity()?.doubleValue(for: unit) else {
            return []
        }

        return [MobileHealthRecord(
            type: "heart_rate_summary",
            sourceRecordId: nil,
            startTime: ISO8601DateFormatter.mobileHealth.string(from: start),
            endTime: ISO8601DateFormatter.mobileHealth.string(from: end),
            value: nil,
            unit: "bpm",
            workoutType: nil,
            durationSeconds: nil,
            distanceKm: nil,
            calories: nil,
            averageHeartRateBpm: Int(average.rounded()),
            minHeartRateBpm: statistics.minimumQuantity().map { Int($0.doubleValue(for: unit).rounded()) },
            maxHeartRateBpm: statistics.maximumQuantity().map { Int($0.doubleValue(for: unit).rounded()) },
            label: nil
        )]
    }
}

private extension JSONEncoder {
    static var mobileHealthEncoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

private extension ISO8601DateFormatter {
    static let mobileHealth: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}
