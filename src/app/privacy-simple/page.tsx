import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacySimplePage() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,var(--health-bg-start),var(--background)_45%,var(--health-bg-end))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <h1 className="text-4xl font-bold tracking-normal">私隱同安全</h1>
        <section className="flex flex-col gap-4 text-2xl font-semibold leading-10">
          <p>我哋唔會用你嘅資料去決定保險承保、收費或索償結果。</p>
          <p>你可以刪除紀錄。</p>
          <p>家庭分享需要你同意。</p>
          <p>緊急情況請打 999。</p>
          <p>這不是醫療診斷。</p>
        </section>
        <Button asChild size="lg" className="min-h-14 w-full rounded-xl text-lg font-bold sm:w-fit">
          <Link href="/today">返去今日</Link>
        </Button>
      </div>
    </main>
  );
}
