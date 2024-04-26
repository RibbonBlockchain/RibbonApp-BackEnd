type IGetPage = { page?: number; pageSize?: number };

const initialGetPage: IGetPage = { page: 1, pageSize: 10 };

export const getPage = (data: IGetPage = initialGetPage) => {
  const page = data.page || initialGetPage.page;
  const pageSize = data.pageSize || initialGetPage.pageSize;

  const limit = pageSize || 10;
  const offset = ((page || 1) - 1) * limit;

  return { limit, offset, page, pageSize };
};
