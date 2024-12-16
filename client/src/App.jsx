import React, { useState, useCallback, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Circle,
  Minus,
  Plus,
  Home,
  Wifi,
  WifiOff,
} from "lucide-react";

// Custom hook for Socket.IO
const useGameSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Replace with your server's IP and port
    socketRef.current = io("http://172.20.10.3:3001");

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const emitEvent = useCallback((eventName, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(eventName, data);
    }
  }, []);

  return { isConnected, emitEvent };
};

const FullscreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      screen.orientation.lock("landscape").catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="fixed top-1  bg-gray-700/80 text-white px-4 py-2 rounded-lg z-50 text-sm"
    >
      {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    </button>
  );
};

const ConnectionStatus = ({ isConnected }) => (
  <div className="fixed bottom-2 bg-gray-700/80 text-white px-4 py-2 rounded-lg z-50 flex items-center gap-2">
    {isConnected ? (
      <>
        <Wifi size={16} className="text-green-400" />
        <span className="text-sm">Connected</span>
      </>
    ) : (
      <>
        <WifiOff size={16} className="text-red-400" />
        <span className="text-sm">Disconnected</span>
      </>
    )}
  </div>
);

const AnalogStick = ({ position = "left", onZoneChange }) => {
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState(null);
  const stickRef = useRef(null);
  const touchIdRef = useRef(null);
  const initialTouchRef = useRef({ x: 0, y: 0 });

  // Set up touch event listeners with { passive: false } on component mount
  useEffect(() => {
    const element = stickRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = Array.from(e.touches).find((t) => {
        if (touchIdRef.current !== null) return false;

        const rect = element.getBoundingClientRect();
        return (
          t.clientX >= rect.left &&
          t.clientX <= rect.right &&
          t.clientY >= rect.top &&
          t.clientY <= rect.bottom
        );
      });

      if (!touch) return;

      const rect = element.getBoundingClientRect();
      touchIdRef.current = touch.identifier;
      initialTouchRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      if (navigator.vibrate) navigator.vibrate(20);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (touchIdRef.current === null || !element) return;

      const rect = element.getBoundingClientRect();
      const touch = Array.from(e.touches).find(
        (t) => t.identifier === touchIdRef.current
      );

      if (!touch) return;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      let x = touch.clientX - rect.left - centerX;
      let y = touch.clientY - rect.top - centerY;

      const radius = rect.width / 3;
      const distance = Math.sqrt(x * x + y * y);

      if (distance > radius) {
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }

      setStickPosition({ x, y });

      const newZone = calculateZone(x, y);
      if (newZone !== activeZone) {
        setActiveZone(newZone);
        onZoneChange?.(newZone);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      const activeTouch = Array.from(e.touches).find(
        (t) => t.identifier === touchIdRef.current
      );

      if (!activeTouch) {
        touchIdRef.current = null;
        initialTouchRef.current = { x: 0, y: 0 };
        setStickPosition({ x: 0, y: 0 });
        setActiveZone(null);
        onZoneChange?.(null);
      }
    };

    // Add event listeners with { passive: false }
    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [activeZone, onZoneChange]);

  const calculateZone = (x, y) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const normalized = (angle + 360) % 360;
    const distance = Math.sqrt(x * x + y * y);

    if (distance < 10) return null;

    if (normalized >= 337.5 || normalized < 22.5) return "E";
    if (normalized >= 22.5 && normalized < 67.5) return "NE";
    if (normalized >= 67.5 && normalized < 112.5) return "N";
    if (normalized >= 112.5 && normalized < 157.5) return "NW";
    if (normalized >= 157.5 && normalized < 202.5) return "W";
    if (normalized >= 202.5 && normalized < 247.5) return "SW";
    if (normalized >= 247.5 && normalized < 292.5) return "S";
    return "SE";
  };

  const baseColor = position === "left" ? "bg-blue-400/20" : "bg-red-400/20";
  const stickColor = position === "left" ? "bg-blue-400/40" : "bg-red-400/40";
  const borderColor =
    position === "left" ? "border-blue-400/30" : "border-red-400/30";

  return (
    <div
      ref={stickRef}
      className={`w-28 h-28 rounded-full relative shadow-lg border-2 ${baseColor} ${borderColor}`}
    >
      <div
        className={`absolute w-16 h-16 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 
          flex items-center justify-center ${stickColor}`}
        style={{
          left: `calc(50% + ${stickPosition.x}px)`,
          top: `calc(50% + ${stickPosition.y}px)`,
          transition: touchIdRef.current !== null ? "none" : "all 0.1s",
        }}
      >
        <Circle className="text-gray-200/80" size={20} />
      </div>
    </div>
  );
};

const SwitchController = () => {
  const [activeButtons, setActiveButtons] = useState(new Set());
  const { isConnected, emitEvent } = useGameSocket();

  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  const handleButtonPress = useCallback(
    (button) => {
      setActiveButtons((prev) => {
        const next = new Set(prev);
        next.add(button);
        if (navigator.vibrate) navigator.vibrate(20);
        return next;
      });
      emitEvent("button-press", button);
    },
    [emitEvent]
  );

  const handleButtonRelease = useCallback(
    (button) => {
      setActiveButtons((prev) => {
        const next = new Set(prev);
        next.delete(button);
        return next;
      });
      emitEvent("button-release", button);
    },
    [emitEvent]
  );

  const createButtonProps = (name) => ({
    onTouchStart: (e) => {
      e.preventDefault();
      handleButtonPress(name);
    },
    onTouchEnd: (e) => {
      e.preventDefault();
      handleButtonRelease(name);
    },
    className: `touch-none select-none transition-transform ${
      activeButtons.has(name) ? "scale-95 opacity-80" : ""
    }`,
  });

  const handleZoneChange = useCallback(
    (side, zone) => {
      emitEvent("stick-zone-change", { side, zone });
    },
    [emitEvent]
  );

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center overflow-hidden touch-none">
      <FullscreenButton />
      <ConnectionStatus isConnected={isConnected} />

      <div className="flex justify-between w-full max-w-7xl px-12">
        {/* Left Joy-Con */}
        <div className="w-72 h-96 bg-blue-400/20 rounded-3xl relative flex flex-col items-center p-8">
          {/* Top Buttons */}
          <div className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between">
            <button
              {...createButtonProps("ZL")}
              className="w-20 h-8 bg-gray-700/90 rounded-lg transform -rotate-12 text-white text-xs flex items-center justify-center"
            >
              ZL
            </button>
            <button
              {...createButtonProps("L")}
              className="w-16 h-8 bg-gray-700/90 rounded-lg transform -rotate-12 text-white text-xs flex items-center justify-center"
            >
              L
            </button>
          </div>

          {/* Minus Button */}
          <button
            {...createButtonProps("minus")}
            className="absolute top-24 right-8 w-8 h-8 bg-gray-700/90 rounded-full flex items-center justify-center"
          >
            <Minus size={16} className="text-white" />
          </button>

          {/* Left Analog Stick */}
          <div className="mt-10">
            <AnalogStick
              position="left"
              onZoneChange={(zone) => handleZoneChange("left", zone)}
            />
          </div>

          {/* D-Pad */}
          <div className="mt-6 relative w-40 h-40">
            {/* Background container with larger touch areas */}
            <div className="absolute inset-0  rounded-2xl grid grid-cols-3 grid-rows-3">
              {/* Up Button - Larger touch area */}
              <div className="col-start-2 col-span-1 relative">
                <button
                  {...createButtonProps("up")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center text-white rounded-t-xl touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-700/90 rounded-full">
                    <ArrowUp size={24} />
                  </div>
                </button>
              </div>

              {/* Middle Row */}
              <div className="row-start-2 col-start-1 relative">
                <button
                  {...createButtonProps("left")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center text-white  rounded-l-xl touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-700/90 rounded-full">
                    <ArrowLeft size={24} />
                  </div>
                </button>
              </div>

              {/* Empty center cell */}
              <div className="row-start-2 col-start-2" />

              <div className="row-start-2 col-start-3 relative">
                <button
                  {...createButtonProps("right")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center text-white  rounded-r-xl touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-700/90 rounded-full">
                    <ArrowRight size={24} />
                  </div>
                </button>
              </div>

              {/* Down Button - Larger touch area */}
              <div className="col-start-2 row-start-3 relative">
                <button
                  {...createButtonProps("down")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center text-white  rounded-b-xl touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-700/90 rounded-full">
                    <ArrowDown size={24} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Button */}
        <div className="flex flex-col items-center justify-center gap-8">
          <button
            {...createButtonProps("home")}
            className="w-12 h-12 bg-gray-700/90 rounded-full flex items-center justify-center"
          >
            <Home size={24} className="text-white" />
          </button>
        </div>

        {/* Right Joy-Con */}
        <div className="w-72 h-96 bg-red-400/20 rounded-3xl relative flex flex-col items-center p-8">
          {/* Top Buttons */}
          <div className="absolute top-0 right-0 w-full px-8 py-6 flex justify-between">
            <button
              {...createButtonProps("R")}
              className="w-16 h-8 bg-gray-700/90 rounded-lg transform rotate-12 text-white text-xs flex items-center justify-center"
            >
              R
            </button>
            <button
              {...createButtonProps("ZR")}
              className="w-20 h-8 bg-gray-700/90 rounded-lg transform rotate-12 text-white text-xs flex items-center justify-center"
            >
              ZR
            </button>
          </div>

          {/* Plus Button */}
          <button
            {...createButtonProps("plus")}
            className="absolute top-24 left-8 w-8 h-8 bg-gray-700/90 rounded-full flex items-center justify-center"
          >
            <Plus size={16} className="text-white" />
          </button>

          {/* Right Analog Stick */}
          <div className="mt-10">
            <AnalogStick
              position="right"
              onZoneChange={(zone) => handleZoneChange("right", zone)}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 relative w-40 h-40">
            {/* Background container with larger touch areas */}
            <div className="absolute inset-0 rounded-2xl grid grid-cols-3 grid-rows-3">
              {/* Y Button - Top */}
              <div className="col-start-2 col-span-1 relative">
                <button
                  {...createButtonProps("Y")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-green-400/30 rounded-full shadow-md">
                    <span className="text-white font-bold text-xl">Y</span>
                  </div>
                </button>
              </div>

              {/* Middle Row - X and B */}
              <div className="row-start-2 col-start-1 relative">
                <button
                  {...createButtonProps("X")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-400/30 rounded-full shadow-md">
                    <span className="text-white font-bold text-xl">X</span>
                  </div>
                </button>
              </div>

              {/* Empty center cell */}
              <div className="row-start-2 col-start-2 bg-transparent" />

              <div className="row-start-2 col-start-3 relative">
                <button
                  {...createButtonProps("B")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-yellow-400/30 rounded-full shadow-md">
                    <span className="text-white font-bold text-xl">B</span>
                  </div>
                </button>
              </div>

              {/* A Button - Bottom */}
              <div className="col-start-2 row-start-3 relative">
                <button
                  {...createButtonProps("A")}
                  className="absolute inset-0 w-full h-full flex items-center justify-center touch-manipulation"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-red-400/30 rounded-full shadow-md">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwitchController;
