/**
 * 通用的云函数调用封装
 * @param {string} name - 云函数名称
 * @param {Object} data - 传递给云函数的数据
 * @param {Object} opt - 额外配置项
 */
export async function callFunction(name, data, opt) {
    // name 参数缺失或类型不正确时提示并抛错
    if (!name || typeof name !== "string") {
      wx.showToast({
        title: "内部错误(name缺失)",
        icon: "none",
      });
      throw new Error("FunctionName missing");
    }
    try {
      // 调用云函数
      return await wx.cloud.callFunction({
        name,
        data,
        config: (opt && opt.config) || {},
      });
    } catch (e) {
      console.error("cloud.callFunction error:", name, e);
      throw e;
    }
  }
