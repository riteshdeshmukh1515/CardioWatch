import { useEffect, useRef } from 'react';

interface Props {
  bpm: number;
  status: 'normal' | 'warning' | 'critical';
}

const STATUS_STROKE = { normal: '#34d399', warning: '#fbbf24', critical: '#f87171' };

export function ECGLine({ bpm, status }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const mid = H / 2;
    const speed = Math.max(2, Math.min(5, bpm / 20));
    const color = STATUS_STROKE[status];

    const ecgShape = (x: number): number => {
      const cycle = x % 100;
      if (cycle < 30) return mid + Math.sin(cycle / 30 * Math.PI) * 4;
      if (cycle < 40) return mid - 2;
      if (cycle < 43) return mid - 30;
      if (cycle < 46) return mid + 20;
      if (cycle < 50) return mid - 10;
      if (cycle < 55) return mid + 5 * Math.sin((cycle - 50) / 5 * Math.PI);
      return mid;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(13,17,23,0.15)';
      ctx.fillRect(0, 0, W, H);

      posRef.current = (posRef.current + speed) % W;
      const x = posRef.current;

      ctx.clearRect(x, 0, 20, H);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(x, 0, 20, H);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      for (let i = Math.max(0, x - 2); i <= x; i++) {
        const y = ecgShape(i + (Date.now() / 10));
        if (i === Math.max(0, x - 2)) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [bpm, status]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full h-20 rounded-xl opacity-80"
    />
  );
}
