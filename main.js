import React, {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Immutable, { List } from 'immutable';
import { Lokka } from 'lokka';
import { Transport } from 'lokka-transport-http';

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

    this.state = {
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
        <Text>
          {JSON.stringify(this.state.stories.toJS())}
        </Text>
        <Text onPress={() => this._loadStories()}>
          Moar!
        </Text>
      </View>
    );
  }

  _updateStories(newStories) {
    this.setState(state => ({
      offset: state.offset + StoriesPerPage,
      stories: state.stories.concat(newStories),
    }));
  }

  async _loadStories() {
    try {
      let newStories = await fetchStories(StoriesPerPage, this.state.offset);
      this._updateStories(newStories);
    } catch(error) {
      alert(`Uh oh it didn't work`);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35,
    backgroundColor: '#eee',
  }
});


AppRegistry.registerComponent('main', () => Main);
