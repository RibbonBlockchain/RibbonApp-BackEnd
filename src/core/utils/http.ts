import { TResult } from '@/core/definitions';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

type THttpGet = { url: string; options?: AxiosRequestConfig; axiosInstance?: AxiosInstance };
type THttpPost = { url: string; body: any; options?: AxiosRequestConfig; axiosInstance?: AxiosInstance };

export const go = async <T, E>(fn: (...args: any[]) => Promise<T>): Promise<TResult<T, E>> => {
  try {
    const data = await fn();
    return [data, null];
  } catch (error) {
    return [null, error];
  }
};

export const httpGet = async <T, E>({
  url,
  options,
  axiosInstance = axios.create(),
}: THttpGet): Promise<TResult<T, E>> => {
  return await go<T, E>(async () => {
    const res = await axiosInstance.get(url, options);
    return res.data;
  });
};

export const httpPost = async <T, E>({
  url,
  body,
  options,
  axiosInstance = axios.create(),
}: THttpPost): Promise<TResult<T, E>> => {
  return await go<T, E>(async () => {
    const res = await axiosInstance.post(url, body, options);
    return res.data;
  });
};

export const toQueryString = (obj: any) => {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};
