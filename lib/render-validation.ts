export function assertRenderAspectRatio(input: {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  tolerance?: number;
}) {
  const tolerance = input.tolerance ?? 0.02;

  if (input.sourceWidth <= 0 || input.sourceHeight <= 0) {
    throw new Error("A arte não está disponível para renderização.");
  }

  const expectedRatio = input.targetWidth / input.targetHeight;
  const actualRatio = input.sourceWidth / input.sourceHeight;

  if (Math.abs(expectedRatio - actualRatio) > tolerance) {
    throw new Error("A proporção da arte não corresponde ao formato final.");
  }
}

export function assertRenderedCanvasDimensions(input: {
  width: number;
  height: number;
  targetWidth: number;
  targetHeight: number;
}) {
  if (
    input.width !== input.targetWidth ||
    input.height !== input.targetHeight
  ) {
    throw new Error(
      `A exportação final deveria ter ${input.targetWidth}×${input.targetHeight}px, mas foi gerada com ${input.width}×${input.height}px.`,
    );
  }
}
