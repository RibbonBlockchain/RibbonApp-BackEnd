type IGetPage = { page?: number; pageSize?: number };

const initialGetPage: IGetPage = { page: 1, pageSize: 10 };

export const getPage = (data: IGetPage = initialGetPage) => {
  const page = data.page || initialGetPage.page;
  const pageSize = data.pageSize || initialGetPage.pageSize;

  const limit = pageSize || 10;
  const offset = ((page || 1) - 1) * limit;

  return { limit, offset, page, pageSize };
};

export const generatePagination = (currentPage = 1, pageSize = 10, totalDataSize: number) => {
  const totalPages = Math.ceil(totalDataSize / pageSize);

  currentPage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalDataSize);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return {
    pageSize,
    endIndex,
    totalPages,
    startIndex,
    currentPage,
    hasNextPage,
    totalDataSize,
    hasPreviousPage,
  };
};
