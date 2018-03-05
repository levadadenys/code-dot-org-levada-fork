import React, {Component, PropTypes} from 'react';
import ProjectCardGrid from './ProjectCardGrid';
import _ from 'lodash';
import {connect} from 'react-redux';
import i18n from "@cdo/locale";

const styles = {
  clear: {
    clear: 'both'
  },
  linkBox: {
    textAlign: 'center',
    width: '100%',
    marginTop: 10,
  },
  link: {
    display: 'inline-block'
  },
};

export const publishedProjectPropType = PropTypes.shape({
  channel: PropTypes.string.isRequired,
  name: PropTypes.string,
  studentName: PropTypes.string,
  studentAgeRange: PropTypes.string,
  thumbnailUrl: PropTypes.string,
  type: PropTypes.string.isRequired,
  publishedAt: PropTypes.string.isRequired,
});

class PublicGallery extends Component {
  static propTypes = {
    // from redux state
    projectLists: PropTypes.shape({
      applab: PropTypes.arrayOf(publishedProjectPropType),
      gamelab: PropTypes.arrayOf(publishedProjectPropType),
      playlab: PropTypes.arrayOf(publishedProjectPropType),
      artist: PropTypes.arrayOf(publishedProjectPropType),
      minecraft: PropTypes.arrayOf(publishedProjectPropType),
    }),
    // We are hiding Applab and Gamelab projects because of inappropriate
    // content in the projects. Except project validators still need to see
    // these project types so they can select which should be featured.
    // TODO: Erin B - remove this when we unhide applab and gamelab.
    showApplabGamelab: PropTypes.bool
  };

  /**
   * Transform the projectLists data from the format expected by the
   * PublicGallery to the format expected by the ProjectCardGrid.
   * See the PropTypes of each component for a definition of each format.
   */
  mapProjectData(projectLists) {
    return _.mapValues(projectLists, projectList => {
      return projectList.map(projectData => {
        return {
          projectData: {
            ...projectData,
            publishedToPublic: true,
            publishedToClass: false,
          },
          currentGallery: "public",
        };
      });
    });
  }

  render() {
    const {projectLists} = this.props;
    return (
      <div>
        <ProjectCardGrid
          projectLists={this.mapProjectData(projectLists)}
          galleryType="public"
          showApplabGamelab={this.props.showApplabGamelab}
        />
        <div style={styles.clear}/>
        <div style={styles.linkBox}>
          <a
            href="https://support.code.org/hc/en-us/articles/360001143952"
            style={styles.link}
          >
            <h3>
              {i18n.reportAbuse()}
            </h3>
          </a>
        </div>
      </div>
    );
  }
}
export default connect(state => ({
  projectLists: state.projects.projectLists,
}))(PublicGallery);
