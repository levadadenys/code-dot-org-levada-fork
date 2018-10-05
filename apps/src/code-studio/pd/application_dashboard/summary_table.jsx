/**
 * Table displaying a summary of application statuses
 */
import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import {Table, Button} from 'react-bootstrap';
import {StatusColors, ApplicationStatuses} from './constants';
import _ from 'lodash';

const styles = {
  table: {
    paddingLeft: '15px',
    paddingRight: '15px'
  },
  tableWrapper: {
    paddingBottom: '30px'
  },
  statusCell: StatusColors,
  viewApplicationsButton: {
    marginRight: '10px'
  }
};

const ApplicationDataPropType = PropTypes.shape({
  locked: PropTypes.number.isRequired,
  unlocked: PropTypes.number.isRequired,
});

export class SummaryTable extends React.Component {
  static propTypes = {
    showLocked: PropTypes.bool,
    caption: PropTypes.string.isRequired,

    // keys are available statuses: {status: ApplicationDataPropType}
    data: PropTypes.objectOf(ApplicationDataPropType),
    path: PropTypes.string.isRequired,
    id: PropTypes.string,
    applicationType: PropTypes.oneOf(['teacher', 'facilitator']).isRequired
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  tableBody() {
    return Object.keys(this.props.data).map((status, i) => {
      const statusData = this.props.data[status];
      const total = statusData.locked + statusData.unlocked;
      return (
        <tr key={i}>
          <td style={{...styles.statusCell[status]}}>
            {ApplicationStatuses[this.props.applicationType][status] || _.upperFirst(status)}
          </td>
          {this.props.showLocked && <td>{statusData.locked}</td>}
          {this.props.showLocked && <td>{statusData.unlocked}</td>}
          <td>{total}</td>
        </tr>
      );
    });
  }

  handleViewClick = (event) => {
    event.preventDefault();
    this.context.router.push(`/${this.props.path}`);
  };

  handleViewCohortClick = (event) => {
    event.preventDefault();
    this.context.router.push(`/${this.props.path}_cohort`);
  };

  render() {
    return (
      <div style={styles.tableWrapper}>
        <Table
          id={this.props.id}
          striped
          condensed
          style={styles.table}
        >
          <caption>{this.props.caption}</caption>
          <thead>
            <tr>
              <th>Status</th>
              {this.props.showLocked && <th>Locked</th>}
              {this.props.showLocked && <th>Unlocked</th>}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {this.tableBody()}
          </tbody>
        </Table>
        <Button
          href={this.context.router.createHref(`/${this.props.path}`)}
          onClick={this.handleViewClick}
          style={styles.viewApplicationsButton}
        >
          View all applications
        </Button>
        <Button
          href={this.context.router.createHref(`/${this.props.path}_cohort`)}
          onClick={this.handleViewCohortClick}
        >
          View accepted cohort
        </Button>
      </div>
    );
  }
}

export default connect(state => ({
  showLocked: state.applicationDashboard.permissions.lockApplication,
}))(SummaryTable);
