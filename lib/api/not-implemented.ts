export function notImplemented(feature: string, phase: string) {
  return Response.json(
    {
      error: `${feature} is not implemented yet.`,
      phase,
    },
    { status: 501 }
  )
}
