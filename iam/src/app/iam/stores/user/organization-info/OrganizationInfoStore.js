import { action, computed, observable } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import queryString from 'query-string';

@store('OrganizationInfoStore')
class OrganizationInfoStore {
  @observable organizationRolesData = [];
  @observable loading = false;
  @observable sidebarVisible = false;
  @observable pagination = {
    current: 1,
    pageSize: 10,
    total: 0,
  };
  @observable params = [];

  refresh(id) {
    this.loadData(id, { current: 1, pageSize: 10 }, {}, []);
  }

  @action
  showSideBar() {
    this.sidebarVisible = true;
  }

  @action
  hideSideBar() {
    this.sidebarVisible = false;
  }

  @action
  loadData(id, pagination = this.pagination, params = this.params) {
    this.loading = true;
    this.params = params;
    return axios.get(`/iam/v1/users/${id}/organization_roles?${queryString.stringify({
      page: pagination.current - 1,
      size: pagination.pageSize,
      params: params.join(','),
    })}`)
      .then(action(({ failed, content, totalElements }) => {
        if (!failed) {
          this.organizationRolesData = content;
          this.pagination = {
            ...pagination,
            total: totalElements,
          };
        }
        this.loading = false;
      }))
      .catch(action((error) => {
        Choerodon.handleResponseError(error);
        this.loading = false;
      }));
  }

}

const organizationInfoStore = new OrganizationInfoStore();
export default organizationInfoStore;
