package hk.aihealth.mobilehealth

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Serializable
data class MobileHealthRecord(
    val type: String,
    val sourceRecordId: String? = null,
    val startTime: String,
    val endTime: String? = null,
    val value: Double? = null,
    val unit: String? = null,
    val workoutType: String? = null,
    val durationSeconds: Int? = null,
    val distanceKm: Double? = null,
    val calories: Int? = null,
    val averageHeartRateBpm: Int? = null,
    val minHeartRateBpm: Int? = null,
    val maxHeartRateBpm: Int? = null,
    val label: String? = null,
)

@Serializable
data class MobileHealthSyncPayload(
    val sourcePlatform: String = "android_health_connect",
    val sourceDevice: String? = android.os.Build.MODEL,
    val idempotencyKey: String,
    val consentGranted: Boolean,
    val records: List<MobileHealthRecord>,
)

class MobileHealthSyncClient(private val baseUrl: String) {
    fun sync(payload: MobileHealthSyncPayload, bearerToken: String): Pair<Int, String> {
        val connection = URL("${baseUrl.trimEnd('/')}/api/mobile-health/sync").openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.setRequestProperty("Authorization", "Bearer $bearerToken")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.doOutput = true
        connection.outputStream.use { stream ->
            stream.write(Json.encodeToString(payload).toByteArray(Charsets.UTF_8))
        }

        val body = runCatching {
            val stream = if (connection.responseCode < 400) connection.inputStream else connection.errorStream
            stream?.bufferedReader()?.use { it.readText() } ?: ""
        }.getOrDefault("")

        return connection.responseCode to body
    }
}

class HealthConnectMobileHealthBridge(context: Context) {
    private val client = HealthConnectClient.getOrCreate(context)

    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
    )

    fun permissionRequestContract() =
        PermissionController.createRequestPermissionResultContract()

    suspend fun missingPermissions(): Set<String> {
        val granted = client.permissionController.getGrantedPermissions()
        return permissions - granted
    }

    suspend fun buildPayload(daysBack: Long, consentGranted: Boolean): MobileHealthSyncPayload = coroutineScope {
        val end = Instant.now()
        val start = end.minus(daysBack.coerceIn(1, 30), ChronoUnit.DAYS)

        val aggregate = async { aggregateSummaries(start, end) }
        val workouts = async { workoutSummaries(start, end) }
        val sleep = async { sleepSummaries(start, end) }
        val heart = async { heartRateSummary(start, end) }

        MobileHealthSyncPayload(
            idempotencyKey = "android-${end.epochSecond}-${UUID.randomUUID()}",
            consentGranted = consentGranted,
            records = (aggregate.await() + workouts.await() + sleep.await() + heart.await()).take(100),
        )
    }

    private suspend fun aggregateSummaries(start: Instant, end: Instant): List<MobileHealthRecord> {
        val response = client.aggregate(
            AggregateRequest(
                metrics = setOf(
                    StepsRecord.COUNT_TOTAL,
                    ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
                    WeightRecord.WEIGHT_AVG,
                ),
                timeRangeFilter = TimeRangeFilter.between(start, end),
            ),
        )

        val records = mutableListOf<MobileHealthRecord>()
        response[StepsRecord.COUNT_TOTAL]?.let { steps ->
            records += MobileHealthRecord(
                type = "steps",
                startTime = start.toString(),
                endTime = end.toString(),
                value = steps.toDouble(),
                unit = "count",
            )
        }
        response[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { energy ->
            records += MobileHealthRecord(
                type = "active_energy",
                startTime = start.toString(),
                endTime = end.toString(),
                value = energy.inKilocalories,
                unit = "kcal",
            )
        }
        response[WeightRecord.WEIGHT_AVG]?.let { weight ->
            records += MobileHealthRecord(
                type = "body_weight",
                startTime = end.toString(),
                value = weight.inKilograms,
                unit = "kg",
            )
        }

        return records
    }

    private suspend fun workoutSummaries(start: Instant, end: Instant): List<MobileHealthRecord> {
        return client.readRecords(
            ReadRecordsRequest(
                recordType = ExerciseSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, end),
            ),
        ).records.take(50).map { record ->
            MobileHealthRecord(
                type = "workout",
                sourceRecordId = record.metadata.id,
                startTime = record.startTime.toString(),
                endTime = record.endTime.toString(),
                workoutType = if (record.exerciseType == ExerciseSessionRecord.EXERCISE_TYPE_RUNNING) "run" else "other",
                durationSeconds = ChronoUnit.SECONDS.between(record.startTime, record.endTime).toInt(),
            )
        }
    }

    private suspend fun sleepSummaries(start: Instant, end: Instant): List<MobileHealthRecord> {
        return client.readRecords(
            ReadRecordsRequest(
                recordType = SleepSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, end),
            ),
        ).records.take(50).map { record ->
            MobileHealthRecord(
                type = "sleep_session",
                sourceRecordId = record.metadata.id,
                startTime = record.startTime.toString(),
                endTime = record.endTime.toString(),
                durationSeconds = ChronoUnit.SECONDS.between(record.startTime, record.endTime).toInt(),
            )
        }
    }

    private suspend fun heartRateSummary(start: Instant, end: Instant): List<MobileHealthRecord> {
        val samples = client.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, end),
            ),
        ).records.flatMap { it.samples }.map { it.beatsPerMinute.toInt() }

        if (samples.isEmpty()) return emptyList()

        return listOf(
            MobileHealthRecord(
                type = "heart_rate_summary",
                startTime = start.toString(),
                endTime = end.toString(),
                unit = "bpm",
                averageHeartRateBpm = samples.average().toInt(),
                minHeartRateBpm = samples.minOrNull(),
                maxHeartRateBpm = samples.maxOrNull(),
            ),
        )
    }
}

