import { SiteState } from "./stateInterface";

export default function() {
  return {
    SET_SITE: (state: SiteState, data) => {
      state.site = data;
    },
    SET_SITES: (state: SiteState, data) => {
      state.sites = data;
    },
    SET_SELECTED_SITE: (state: SiteState, site) => {
      state.selectedSite = site;
    },
  };
}
