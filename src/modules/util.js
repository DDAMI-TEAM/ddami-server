const util = {
  success: (status, message, data) => ({
    status,
    result: 1,
    message,
    data,
  }),
  fail: (status, message, data) => ({
    status,
    retult: 0,
    message,
    data
  }),
};

export default util;