// Capture sheet geometry (design/mocks/r3/sheet). Exported so the home screen
// can keep its content clear of the peek.

/** Grabber 11 + 16 + field 52 + 14 + mic row 60. */
export const peekContentHeight = 153;
/** Voice: status, 34pt timer, hint, 68pt wave, transcript, then the mic and its ring. */
export const voiceContentHeight = 418;

export const sheetBottomPad = (bottomInset: number) =>
  Math.max(bottomInset, 12);

/** Height of the collapsed capture sheet (the peek), including the home-indicator area. */
export const capturePeekHeight = (bottomInset: number) =>
  peekContentHeight + sheetBottomPad(bottomInset);

/** How long a discarded recording can still be restored by its Undo. */
export const voiceUndoWindowMillis = 10000;
