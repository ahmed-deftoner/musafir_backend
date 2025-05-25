export function generateUniqueCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;
  let result = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export function generateRandomPassword(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const codeLength = 8;
  let result = '';

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export const successResponse = (
  data: any,
  message: string,
  statusCode: number = 200,
) => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};

export const errorResponse = (error: any) => {
  return {
    success: false,
    statusCode: error.status || 500,
    message: error.message || 'Internal server error',
    error: error.name || 'Error',
  };
};
