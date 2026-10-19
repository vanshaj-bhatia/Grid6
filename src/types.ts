export type PageSize = 'A4' | 'LETTER' | 'A3' | 'LEGAL';
export type PageOrientation = 'landscape' | 'portrait';
export type PageOrder = 'horizontal' | 'vertical'; // horizontal: 1,2,3 / 4,5,6; vertical: 1,3,5 / 2,4,6
export type PictureScaling = 'fitWidth' | 'inside' | 'stretch' | 'cropBottomQuarter';
export type PictureAlign = 'top-middle' | 'center' | 'bottom-middle';

export interface GridConfig {
  cols: number; // 3 in landscape, 2 in portrait
  rows: number; // 2 in landscape, 3 in portrait
  pageSize: PageSize;
  orientation: PageOrientation;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapXMm: number;
  gapYMm: number;
  pictureScaling: PictureScaling; // Default: 'fitWidth' (matches input page width to cell width)
  pictureAlign: PictureAlign;     // Default: 'top-middle' (anchors top middle so header/barcode is never cropped)
  clipToCell: boolean;           // Default: true (ensures bottom overflow doesn't spill into adjacent cells)
  drawBorders: boolean;
  borderWidthPt: number;
  borderColorHex: string;
  drawCutGuides: boolean;
  drawPageNumbers: boolean; // Default: false (page numbers omitted by default)
  pageOrder: PageOrder;
  appName: string; // Default: 'Grid6_PDF'
}

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number | null;
  status: 'idle' | 'analyzing' | 'processing' | 'done' | 'error';
  progress: number; // 0 - 100
  errorMsg?: string;
  outputBlob?: Blob;
  outputUrl?: string;
  outputSheetCount?: number;
  outputSize?: number;
  createdAt: number;
}

export interface StorageDirectoryHandle {
  handle: FileSystemDirectoryHandle | null;
  folderName: string;
  isSupported: boolean;
}
