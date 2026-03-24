"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // 개발 모드에서는 SW 등록 안 함
    if (process.env.NODE_ENV === "development") {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // 서비스 워커 업데이트 감지
    const handleControllerChange = () => {
      console.log("[PWA] 새로운 버전이 적용되었습니다.");
      window.location.reload();
    };

    // 서비스 워커 등록 및 업데이트 체크
    navigator.serviceWorker.ready.then((registration) => {
      // 컨트롤러 변경 감지 (새 SW가 활성화될 때)
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        handleControllerChange
      );

      // 주기적으로 업데이트 확인 (1시간마다)
      const intervalId = setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000
      );

      return () => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          handleControllerChange
        );
        clearInterval(intervalId);
      };
    });

    // 페이지 로드 시 즉시 업데이트 확인
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.error("[PWA] Service Worker 등록 실패:", error);
      });
  }, []);

  return null;
}
