import React, {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Immutable, { List } from 'immutable';
import { Lokka } from 'lokka';
import { Transport } from 'lokka-transport-http';

const FeedView = require('FeedView');

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

const StoriesPerPage = 1;

class Main extends React.Component {

  constructor(props) {
    super(props);

    let dataSource = new FeedView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
    });

    this.state = {
      dataSource,
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
          renderRow={this._renderRow.bind(this)}
          dataSource={this.state.dataSource} />
        <TouchableOpacity style={styles.moreButtonContainer} onPress={this._loadStories.bind(this)}>
          <Text style={styles.moreButton}>
            Load more!
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  _renderRow(story) {
    return (
      <View style={styles.row}>
        <Text>{story.get('title')}</Text>
      </View>
    );
  }

  async _loadStories() {
    if (this._isLoading) {
      return;
    }

    try {
      this._isLoading = true;
      let newStories = await fetchStories(StoriesPerPage, this.state.offset);
      let stories = this.state.stories.concat(newStories);

      this.setState(state => ({
        dataSource: state.dataSource.cloneWithRows(stories.toArray()),
        offset: state.offset + StoriesPerPage,
        stories,
      }));
    } catch(error) {
      alert(`Uh oh it didn't work`);
    } finally {
      this._isLoading = false;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35,
    backgroundColor: '#eee',
  },
  moreButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  moreButton: {
    color: '#fff',
  },
});


AppRegistry.registerComponent('main', () => Main);
