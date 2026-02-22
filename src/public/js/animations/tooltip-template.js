export const makeToolTipTemplate = (title, content) => {
  return `
  <div class="stack-tooltip">
    <h3>${title}</h3>
    <p>
      ${content}
    </p>
  </div>
  `;
};
