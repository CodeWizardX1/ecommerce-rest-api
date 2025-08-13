function paged(data, { limit, offset, total }) {
  return { data, paging: { limit, offset, total } };
}
export { paged };
