import { of } from 'rxjs';

export const mockActivatedRoute = (params: any = {}, queryParams: any = {}) => ({
  params: of(params),
  queryParams: of(queryParams),
  snapshot: {
    params: params,
    queryParams: queryParams,
    paramMap: {
      get: (key: string) => params[key] || null,
      has: (key: string) => key in params,
      getAll: (key: string) => params[key] ? [params[key]] : [],
      keys: Object.keys(params)
    },
    queryParamMap: {
      get: (key: string) => queryParams[key] || null,
      has: (key: string) => key in queryParams,
      getAll: (key: string) => queryParams[key] ? [queryParams[key]] : [],
      keys: Object.keys(queryParams)
    }
  }
});