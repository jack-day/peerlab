/** @module */
/** Responsive Masonry Grid */
export default class MasonryGrid extends HTMLElement {
    constructor(columnCount) {
        super();
        this.columnCount = columnCount ? columnCount : parseInt(this.dataset.columns);
        this.childCount = 0;
        this.columns = [];
        this.active = false;

        // Create columns
        for (let i = 0; i < this.columnCount; i++) {
            const column = document.createElement('section');
            column.classList.add('column');
            this.columns.push(column);
        }

        // Activate on non-mobile devices
        if (window.innerWidth >= 768) this.activate();

        // Listen for resize to responsively activate/deactivate
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768 && this.active) {
                this.deactivate();
            } else if (window.innerWidth >= 768 && !this.active) {
                this.activate();
            }
        }); 
    }

    /**
     * Append nodes to the masonry grid. If the masonry grid is active,
     * it will sort them into the columns in-order.
     * @param  {...Node} nodes Nodes to be appended
     */
    append(...nodes) {
        for (const node of nodes) {
            if (this.active) {
                if (this.columns.includes(node)) {
                    super.append(node); // Append this grid's columns normally
                } else {
                    // Get column position for next node
                    let columnPos = (this.childCount + 1) % this.columnCount;
    
                    // Column position will be zero if equal to column count
                    if (columnPos === 0) columnPos = this.columnCount;
    
                    this.columns[columnPos - 1].append(node);
                    this.childCount++;
                }
            } else {
                super.append(node);
            }
        }
    }

    /** Activate the masonry grid and sort all children into columns */
    activate() {
        this.active = true;

        // Move this element's children into columns
        this.append(...this.children);
        
        // Append columns to this element
        for (const column of this.columns) this.append(column);
    }

    /**
     * Deactivate the masonry grid, moving all elements out of columns in-order
     * and removing the grid columns
     */
    deactivate() {
        this.active = false;

        // Move elements out of columns
        while (this.childCount > 0) {
            let columnPos = this.childCount % this.columnCount;
            if (columnPos === 0) columnPos = this.columnCount;
            this.prepend(this.columns[columnPos - 1].lastChild);
            this.childCount--;
        }
        
        // Remove columns from this element
        for (const column of this.columns) column.remove();
    }
}

customElements.define('masonry-grid', MasonryGrid);
