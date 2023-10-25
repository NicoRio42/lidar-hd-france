type BaseTileItem = {
	x: number;
	y: number;
};

export type TileItem = BaseTileItem &
	(
		| { isBuffer: false }
		| {
				isBuffer: true;
				type: TileItemBufferType;
		  }
	);

export type TileItemBufferType =
	| 'top'
	| 'right'
	| 'bottom'
	| 'left'
	| 'outCornerTopLeft'
	| 'outCornerTopRight'
	| 'outCornerBottomRight'
	| 'outCornerBottomLeft'
	| 'inCornerTopLeft'
	| 'inCornerTopRight'
	| 'inCornerBottomRight'
	| 'inCornerBottomLeft'
	| 'full';
