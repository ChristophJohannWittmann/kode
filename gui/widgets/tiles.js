/*****
 * Copyright (c) 2017-2023 Kode Programming
 * https://github.com/KodeProgramming/kode/blob/main/LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*****/


/*****
 * In geometric terms, a tile is a two-dimensional shape that can completely
 * cover a survey.  Examples are hexagons and squares.  Circles are not tiles
 * because they are unable to completely cover a surface.  In the framework, a
 * WSurface widget is an array of tiles that are arranged into rows and columns
 * for viewing.  Tiles are not always symmetric in that some tiles may be larger
 * than others or have a different aspect ration.  Please note the freeze() and
 * frozen features.  These are there primarily there to enable external code to
 * freeze the surface, make serveral changes, and then to unfreeze that surface.
 * The point is to avoid excessive computations in the resize() method while an
 * external agent is making multiple modifications to the surface tiles.
*****/
register(class WSurface extends Widget {
    constructor() {
        super();
        this.setWidgetStyle('surface');

        this.snap = 300;
        this.tiles = [];
        this.frozen = true;

        win.on('dom.resize', message => this.resize());
        this.on('Widget.Changed', message => this.resize());
    }

    clear() {
        this.tiles = [];
        super.clear();
        return this;
    }

    clearSnap() {
        this.snap = 300;
        return this;
    }

    freeze() {
        this.frozen = true;
        return this;
    }

    getSnap() {
        return this.snap;
    }

    isFrozen() {
        return this.frozen;
    }

    pop() {
        if (this.tiles.length) {
            this.tiles.pop().remove();
        }

        return this;
    }

    push(...tiles) {
        tiles.forEach(tile => this.tiles.push(tile));
        this.resize();
        return this;
    }

    resize() {
        if (!this.frozen) {
            this.silence();
            super.clear();

            const width = this.getOffsetWidth();
            let gridRowHeights = [];
            let gridColumnWidths = [];
            let gridColumnCount = Math.floor(width / this.snap);
            let gridColumnWidth = Math.floor(this.snap + (width % this.snap)/gridColumnCount);
            let gridRowCount = Math.ceil(this.tiles.length / gridColumnCount);

            for (let i = 0; i < gridColumnCount; i++) {
                gridColumnWidths.push(gridColumnWidth);
            }

            if (gridRowCount) {
                for (let i = 0; i < this.tiles.length; i++) {
                    let tile = this.tiles[i];
                    let row = Math.floor(i / gridColumnCount);
                    let col = i % gridColumnCount;

                    tile.preferredWidth = Math.floor(gridColumnWidth * tile.getAspectRatio() * tile.getZoom());
                    tile.preferredHeight = Math.floor(gridColumnWidth / tile.getAspectRatio() * tile.getZoom());

                    if (tile.preferredWidth > gridColumnWidths[col]) {
                        gridColumnWidths[col] = tile.preferredWidth;
                    }

                    if (row >= gridRowHeights.length) {
                        gridRowHeights.push(tile.preferredHeight);
                    }
                    else if (tile.preferredHeight > gridRowHeights[row]) {
                        gridRowHeights[row] = tile.preferredHeight;
                    }
                }

                let widthSum = Math.ceil(gridColumnWidths.reduce((x, y) => x + y, 0));
                let delta = Math.floor((width - widthSum) / gridColumnCount);

                for (let i = 0; i < gridColumnCount; i++) {
                    gridColumnWidths[i] += delta;
                }

                this.grid = mkWGrid({
                    rows: gridRowHeights.map(rh => `${rh}px`),
                    cols: gridColumnWidths.map(cw => `${cw}px`)
                });

                for (let i = 0; i < this.tiles.length; i++) {
                    let tile = this.tiles[i];
                    let row = Math.floor(i / gridColumnCount);
                    let col = i % gridColumnCount;

                    if (tile.hasBorder()) {
                        this.setStyle('border-width', `var(--widget-border-width)`);

                        setTimeout(() => {
                            let borderWidth = parseInt(tile.getComputedStyle().getPropertyValue('border-top-width').replaceAll('px', ''));

                            tile.setStyle({
                                width: `${tile.preferredWidth-2*borderWidth}px`,
                                height: `${tile.preferredHeight-2*borderWidth}px`,
                                borderColor: `var(--widget-border-color)`,
                                borderStyle: `var(--widget-border-style)`,
                                borderWidth: `var(--widget-border-width)`,
                            });
                        }, 1);
                    }
                    else {
                        tile.setStyle({
                            width: `${tile.preferredWidth}px`,
                            height: `${tile.preferredHeight}px`,
                        });
                    }

                    let tileFrame = mkWidget()
                    .setWidgetStyle('tile-frame')
                    .setStyle('height', `${gridRowHeights[row]}px`)
                    .append(tile);

                    this.grid.setAt(row, col, tileFrame);
                }

                this.append(this.grid);
                this.resume();
            }
        }

        return this;
    }

    setSnap(snap) {
        this.snap = typeof snap == 'number' ? Math.abs(snap) : this.snap;
        return this;
    }

    shift() {
        if (this.tiles.length) {
            this.tiles.shift().remove();
        }

        return this;
    }

    thaw() {
        this.frozen = false;
        setTimeout(() => this.resize(), 10);
        return this;
    }

    unshift(...tiles) {
        tiles.reverse().forEach(tile => this.tiles.unshift(tile));
        this.resize();
        return this;
    }
});


/*****
 * A tile is a single viewable widget that's placed on the surface of a WSurface
 * document element.  Via the API, a widget border can be displayed using the
 * widget style in the main stylesheet.  Once of the interesting features is that
 * by default, tiles are square and of idential size.  On an individual tiles
 * basis, the aspect ratio and zoom (relative size) may be configured for each
 * individual WTile Widget.
*****/
register(class WTile extends Widget {
    constructor() {
        super();
        this.setWidgetStyle('tile');
        this.zoom = 1;
        this.border = false;
        this.aspectRatio = false;
    }

    clearAspectRatio() {
        this.aspectRatio = false;
        return this;
    }

    clearBorder() {
        this.border = false;
        return this;
    }

    clearZoom() {
        this.zoom = 1;
        return this;
    }

    getAspectRatio() {
        return this.aspectRatio === false ? 1 : this.aspectRatio;
    }

    getZoom() {
        return this.zoom;
    }

    hasAspectRatio() {
        return this.aspectRatio !== false;
    }

    hasBorder() {
        return this.border;
    }

    setAspectRatio(value) {
        if (typeof value == 'number') {
            this.aspectRatio = value;
        }
        else {
            this.aspectRatio = 1;
        }

        return this;
    }

    setBorder() {
        this.border = true;
        return this;
    }

    setZoom(value) {
        if (typeof value == 'number') {
            this.zoom = value;
        }
        else {
            this.clearZoom();
        }

        return this;
    }
});
