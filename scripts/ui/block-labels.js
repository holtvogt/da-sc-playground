/*
 * Labels a block shows next to record values, such as `Ranking`. Authors
 * override a label in a block row of two cells, such as `Ranking | World rank`.
 * The first cell names the default label, and the second holds the new one.
 */

const normalize = (text) => text.trim().toLowerCase();

/**
 * @param {Element} cell
 * @returns {?HTMLParagraphElement} The paragraph, when it is all the cell holds
 */
function readOnlyParagraph(cell) {
  const [child] = cell.children;
  return cell.children.length === 1 && child.tagName === 'P' ? child : null;
}

export default class BlockLabels {
  #defaults;

  #keysByDefault;

  /** @type {Map<string, {text: string, cell: Element}>} */
  #overrides = new Map();

  /** @param {Object<string, string>} defaults Default label text, by key */
  constructor(defaults) {
    this.#defaults = defaults;
    this.#keysByDefault = new Map(Object.entries(defaults)
      .map(([key, text]) => [normalize(text), key]));
  }

  /**
   * Takes the rows that override a label, so they are not shown as copy.
   * An override without a new label keeps the default.
   * @param {Element[]} rows Block rows
   * @returns {Element[]} The other rows
   */
  claimRows(rows) {
    return rows.filter((row) => {
      if (row.children.length !== 2) return true;
      const [nameCell, labelCell] = row.children;
      const key = this.#keysByDefault.get(normalize(nameCell.textContent));
      if (!key) return true;
      const text = labelCell.textContent.trim();
      if (text) this.#overrides.set(key, { text, cell: labelCell });
      return false;
    });
  }

  /**
   * @param {string} key
   * @returns {string} The authored label, or the default
   */
  text(key) {
    return this.#overrides.get(key)?.text ?? this.#defaults[key];
  }

  /**
   * The label for the one place it appears. The authored paragraph moves there,
   * because the da.live canvas only keeps the elements it annotated editable.
   * Labels repeated on a page use {@link BlockLabels#text} instead.
   * @param {string} key
   * @returns {HTMLParagraphElement|string} The authored paragraph, or the label text
   */
  place(key) {
    const override = this.#overrides.get(key);
    const paragraph = override && readOnlyParagraph(override.cell);
    return paragraph ?? this.text(key);
  }
}
