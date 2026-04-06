"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // 컨트롤러 변경 감지 (새 SW가 활성화될 때)
    const handleControllerChange = () => {
      console.log("[PWA] 새로운 버전이 적용되었습니다.");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    // 주기적으로 업데이트 확인 (1시간마다)
    navigator.serviceWorker.ready.then((registration) => {
      const intervalId = setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000
      );

      return () => {
        clearInterval(intervalId);
      };
    });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  return null;
}
