import React, {
  Animated,
  AppRegistry,
  ProgressBarAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Immutable, { List } from 'immutable';
import { Lokka } from 'lokka';
import { Transport } from 'lokka-transport-http';

const FeedView = require('FeedView');
const performanceNow = require('performanceNow');

function burnCPU(milliseconds) {
  const start = performanceNow();
  while (performanceNow() < (start + milliseconds)) {}
}

let client = new Lokka({
  transport: new Transport('http://www.graphqlhub.com/graphql')
});

function fetchStories(count, offset=0) {
  return new Promise((resolve, reject) => {
    client.query(`
      {
        hn {
          topStories(limit: ${count}, offset: ${offset}) {
            title
            url
            text
            timeISO
            by {
              id
            }
          }
        }
      }
    `).then(result => {
      resolve(Immutable.fromJS(result.hn.topStories));
    }).catch(error => {
      reject(error);
    });
  });
}

const StoriesPerPage = 30;

class Main extends React.Component {

  constructor(props) {
    super(props);

    let dataSource = new FeedView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
    });

    this.state = {
      dataSource,
      loadingOpacity: new Animated.Value(0),
      offset: 0,
      stories: List(),
    };
  }

  componentWillMount() {
    this._loadStories();
  }

  render() {
    return (
      <View style={styles.container}>
        <FeedView
          contentContainerStyle={styles.listContentContainer}
          onPresentBatch={this._onPresentBatch.bind(this)}
          pageSize={30}
          renderRow={this._renderRow.bind(this)}
          dataSource={this.state.dataSource} />
        <TouchableOpacity style={styles.moreButtonContainer} onPress={this._loadStories.bind(this)}>
          <Text style={styles.moreButton}>
            Load more!
          </Text>
          <Animated.View style={{opacity: this.state.loadingOpacity, marginLeft: -15, transform: [{scale: 0.35}]}}>
            <ProgressBarAndroid color="orange" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }

  _removeStory(story) {
    let { stories } = this.state;
    let i = stories.indexOf(story);
    let updatedStories = stories.remove(i);

    this.setState(state => ({
      dataSource: state.dataSource.cloneWithRows(updatedStories.toArray()),
      stories: updatedStories,
    }));
  }

  _renderRow(story) {
    burnCPU(50);

    return (
      <TouchableOpacity style={styles.row} onPress={() => this._removeStory(story) }>
        <Text style={styles.title}>
          {story.get('title')}
        </Text>
        <Text style={styles.author}>
          {story.getIn(['by', 'id'])}
        </Text>
      </TouchableOpacity>
    );
  }

  _onPresentBatch() {
    this.state.loadingOpacity.setValue(0);
  }

  async _loadStories() {
    if (this._isLoading) {
      return;
    }

    try {
      this._isLoading = true;
      Animated.spring(this.state.loadingOpacity, {toValue: 1}).start();
      let newStories = await fetchStories(StoriesPerPage, this.state.offset);
      let stories = this.state.stories.concat(newStories);

      this.state.loadingOpacity.setValue(0.7);
      requestAnimationFrame(() => {
        this.setState(state => ({
          dataSource: state.dataSource.cloneWithRows(stories.toArray()),
          offset: state.offset + StoriesPerPage,
          stories,
        }));
      });
    } catch(error) {
      alert(`Uh oh it didn't work`);
    } finally {
      this._isLoading = false;
      Animated.spring(this.state.loadingOpacity, {toValue: 0.3}).start();
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25,
    backgroundColor: '#eee',
  },
  listContentContainer: {
    paddingBottom: 50,
  },
  moreButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    paddingLeft: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    flexDirection: 'row',
  },
  moreButton: {
    color: '#fff',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  author: {
    color: 'rgba(0,0,0,0.8)',
  },
  row: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  }
});


AppRegistry.registerComponent('main', () => Main);
