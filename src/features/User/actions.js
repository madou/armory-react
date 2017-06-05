// @flow

import axios from 'axios';
import history from 'history';

import { paginatedThunk } from 'lib/redux';
import { readPvpSeasonIds } from 'lib/gw2';
import config from 'config';
import actions from 'features/Gw2/actions';

export const FETCHING_USER = 'FETCHING_USER';
export const FETCHING_USER_CHARACTERS = 'FETCHING_USER_CHARACTERS';
export const FETCHING_USER_RESULT = 'FETCHING_USER_RESULT';
export const FETCHING_USER_CHARACTERS_RESULT = 'FETCHING_USER_CHARACTERS_RESULT';
export const FETCH_PVP_STATS_RESULT = 'FETCH_PVP_STATS_RESULT';
export const FETCH_USER_ACHIEVEMENTS_RESULT = 'FETCH_USER_ACHIEVEMENTS_RESULT';
export const FETCH_PVP_GAMES_RESULT = 'FETCH_PVP_GAMES_RESULT';
export const FETCH_PVP_STANDINGS_RESULT = 'FETCH_PVP_STANDINGS_RESULT';
export const SELECT_USER = 'SELECT_USER';
export const UPDATE_USER_PRIVACY = 'UPDATE_USER_PRIVACY';

const fetchingUser = (fetching) => ({
  type: FETCHING_USER,
  payload: fetching,
});

const fetchUserResult = (user) => ({
  type: FETCHING_USER_RESULT,
  payload: user,
});

const fetchUserCharactersResult = (alias, characters) => ({
  type: FETCHING_USER_CHARACTERS_RESULT,
  payload: {
    alias,
    characters,
  },
});

const fetchUserAchievementsResult = (alias, achievements) => ({
  type: FETCH_USER_ACHIEVEMENTS_RESULT,
  payload: {
    alias,
    achievements,
  },
});

const fetchingUserCharacters = (fetching) => ({
  type: FETCHING_USER_CHARACTERS,
  payload: fetching,
});

export const fetchUserCharacters = (alias: string, limit: number, offset: number): ReduxThunk =>
  paginatedThunk((dispatch: Dispatch) => {
    dispatch(fetchingUserCharacters(true));

    return axios.get(`${config.api.endpoint}users/${alias}/characters`, {
      params: {
        limit,
        offset,
      },
    })
    .then((response) => {
      dispatch(fetchUserCharactersResult(alias, response.data));
      dispatch(fetchingUserCharacters(false));
    });
  }, `users.data[${alias}].characters`, limit, offset);

export const fetchUserAchievements = (alias: string): ReduxThunk => (dispatch) =>
  axios.get(`${config.api.endpoint}users/${alias}/achievements`)
    .then(({ data }) => dispatch(fetchUserAchievementsResult(alias, data)));

export const fetchPvpStatsSuccess = (alias: string, data: {}) => ({
  type: FETCH_PVP_STATS_RESULT,
  payload: {
    alias,
    data,
  },
});

export const fetchPvpGamesSuccess = (alias: string, data: {}) => ({
  type: FETCH_PVP_GAMES_RESULT,
  payload: {
    alias,
    data,
  },
});

export const fetchPvpStandingsSuccess = (alias: string, data: {}) => ({
  type: FETCH_PVP_STANDINGS_RESULT,
  payload: {
    alias,
    data,
  },
});

export const selectUser = (alias: string) => ({
  type: SELECT_USER,
  payload: alias,
});

export const fetchPvpStats = (alias: string): ReduxThunk => (dispatch) =>
  axios.get(`${config.api.endpoint}users/${alias}/pvp/stats`)
  .then((response) => {
    dispatch(fetchPvpStatsSuccess(alias, response.data));
  });

export const fetchPvpGames = (alias: string): ReduxThunk => (dispatch) =>
  axios.get(`${config.api.endpoint}users/${alias}/pvp/games`)
  .then(({ data }) => {
    dispatch(fetchPvpGamesSuccess(alias, data));

    const ids = data.map((standing) => standing.map_id);
    dispatch(actions.fetchMaps(ids));
  });

export const fetchPvpStandings = (alias: string): ReduxThunk => (dispatch) =>
 axios.get(`${config.api.endpoint}users/${alias}/pvp/standings`)
  .then(({ data }) => {
    dispatch(fetchPvpStandingsSuccess(alias, data));
    return readPvpSeasonIds();
  })
  .then((ids) => dispatch(actions.fetchPvpSeasons(ids)));

export const fetchUser = (
  alias: string,
): ReduxThunk =>
  (dispatch) => {
    dispatch(fetchingUser(true));

    return axios.get(`${config.api.endpoint}users/${alias}`)
      .then(({ data }) => {
        dispatch(fetchUserResult(data));
        dispatch(fetchPvpStandings(alias));
        dispatch(fetchPvpStats(alias));
        dispatch(fetchUserAchievements(alias));
        dispatch(fetchingUser(false));
        dispatch(actions.fetchWorlds([data.world]));
      }, ({ response: { status } = {} } = {}) => status === 404 && history.replace('/404'));
  };

export const updatePrivacy = (name: string, prop: string, action: string) => ({
  type: UPDATE_USER_PRIVACY,
  payload: {
    name,
    prop,
    action,
  },
});

export function setPrivacy (name: string, prop: string): ReduxThunk {
  return (dispatch) => {
    dispatch(updatePrivacy(name, prop, 'add'));
    return axios.put(`${config.api.endpoint}users/me/privacy`, {
      privacy: prop,
    });
  };
}

export function removePrivacy (name: string, prop: string): ReduxThunk {
  return (dispatch) => {
    dispatch(updatePrivacy(name, prop, 'remove'));
    return axios.delete(`${config.api.endpoint}users/me/privacy/${prop}`);
  };
}
