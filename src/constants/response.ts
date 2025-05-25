export const errorResponse = (error: any) => {
    return {
      statusCode: error?.statusCode || error?.status || 400,
      message: typeof error === 'string' ? error : error.message || 'Bad Request',
      error: error.name || error,
      data: null,
    };
  };
  
  export const successResponse = (
    data: object,
    message: string,
    statusCode?: number,
  ) => {
    return {
      statusCode: statusCode || 200,
      message: message,
      data: data,
      error: null,
    };
  };