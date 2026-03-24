export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#5e6ad2] px-6 py-16 text-[#111318]">
      <div className="flex w-full max-w-[520px] flex-col gap-4 rounded-[24px] border border-black/8 bg-white/80 p-8 shadow-[0_24px_80px_rgba(17,19,24,0.08)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b756b]">
          Offline
        </p>
        <h1 className="font-display text-[32px] leading-[1.05] font-bold">
          지금은 네트워크에 연결되어 있지 않습니다.
        </h1>
        <p className="text-[15px] leading-6 text-[#5d6470]">
          연결이 복구되면 다시 최신 내용을 불러올 수 있습니다. 이미 방문한
          화면은 일부 계속 사용할 수 있어요.
        </p>
      </div>
    </main>
  );
}
