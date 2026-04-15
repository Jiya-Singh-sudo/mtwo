// function useMobileTableQuery(initial = {}) {
//   const [query, setQuery] = useState({
//     page: 1,
//     limit: 10,
//     search: '',
//     sortBy: 'room_no',
//     sortOrder: 'asc',
//     status: undefined,
//     ...initial,
//   });

//   const setSearch = (search: string) =>
//     setQuery((prev) => ({ ...prev, search, page: 1 }));

//   const setPage = (page: number) =>
//     setQuery((prev) => ({ ...prev, page }));

//   const setSort = (sortBy: string) =>
//     setQuery((prev) => ({ ...prev, sortBy }));

//   const setStatus = (status?: string) =>
//     setQuery((prev) => ({ ...prev, status, page: 1 }));

//   return { query, setQuery, setSearch, setPage, setSort, setStatus };
// }