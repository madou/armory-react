// @flow

import type { PvpStanding, Paginated } from 'flowTypes';

import { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import T from 'i18n-react';
import times from 'lodash/times';

import Progress from 'common/components/Icon/Progress';
import ContentCard from 'common/components/ContentCard';
import Paginator from 'common/components/Paginator';
import { fetchPvpLeaderboard } from '../../actions';
import styles from './styles.less';
import { renderButton } from 'common/layouts/PaginatorGrid';

const STANDINGS_PER_PAGE = 30;
const STUB_STANDINGS = { rows: times(STANDINGS_PER_PAGE, () => undefined), count: 9999 };

function buildContent (standing, rank) {
  const winsText = T.translate('users.pvpStats.wins');
  const lossesText = T.translate('users.pvpStats.losses');
  const ratingText = T.translate('users.pvpStats.rating');

  return standing && {
    alias: `#${rank} ${standing.alias}`,
    accountName: `${standing.ratingCurrent} ${ratingText} | ${standing.wins || '-'} ${winsText} | ${standing.losses || '-'} ${lossesText}`,
  };
}

function createInner (standing?: PvpStanding, rank) {
  const isFirstPlace = rank === 1;

  return (
    <div className={isFirstPlace ? styles.firstContainer : styles.closeToFirstContainer}>
      <ContentCard
        type="users"
        size={isFirstPlace ? 'big' : 'small'}
        content={buildContent(standing, rank)}
      />

      {isFirstPlace && <div className={styles.firstContainerBg} />}
    </div>
  );
}

function mapStateToProps (state, props) {
  return {
    leaderboard: state.leaderboards.pvp[props.region],
  };
}

type Props = {
  fetchPvpLeaderboard: () => Promise<>,
  leaderboard?: Paginated<PvpStanding>,
  region: 'gw2a' | 'na' | 'eu',
};

@connect(mapStateToProps, {
  fetchPvpLeaderboard,
})
export default class PvpLeaderboard extends Component {
  props: Props;

  static defaultProps = {
    fetchPvpLeaderboard: () => Promise.resolve(),
  };

  renderStanding = (standing?: PvpStanding, index: number) => {
    return (
      <li
        key={standing ? standing.accountName : index}
        className={styles.standing}
      >
        <Link to={`/${standing ? standing.alias : ''}`}>{createInner(standing, index + 1)}</Link>
      </li>
    );
  }

  render () {
    const { leaderboard, fetchPvpLeaderboard: fetchLeaderboard, region } = this.props;
    const pvpLeaderboard = (leaderboard && leaderboard.rows) ? leaderboard : STUB_STANDINGS;

    return (
      <div className={styles.root}>
        <Paginator
          key={region}
          rows={pvpLeaderboard.rows}
          limit={STANDINGS_PER_PAGE}
          count={pvpLeaderboard.count}
          action={(limit, offset) => fetchLeaderboard(region, limit, offset)}
          progressComponent={<Progress className={styles.progress} />}
          renderContainer={(children) => <ol>{children}</ol>}
          renderButton={renderButton}
        >
          {this.renderStanding}
        </Paginator>
      </div>
    );
  }
}
