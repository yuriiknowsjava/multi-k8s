import { Component, SyntheticEvent } from 'react';
import axios from 'axios';

interface State {
    seenIndexes: { fib_index: string }[],
    values: {
        [key: string]: string
    },
    index: string
}

class Fib extends Component<{}, State> {
    state: State = {
        seenIndexes: [],
        values: {},
        index: '',
    };

    componentDidMount() {
        this.fetchValues();
        this.fetchIndexes();
    }

    async fetchValues() {
        try {
            const values = await axios.get('/api/values/current');
            if (typeof(values.data) === 'object') {
                this.setState({
                    values: values.data,
                });
            } else {
                console.error(`'Data that come from the API is of type ${typeof(values.data)}. Expected an Object'`);
                const v: { [key: string]: string } = {};
                this.setState({ values: v, });
            }
        } catch (e) {
            const values: { [key: string]: string } = {};
            this.setState({ values, });
            console.error(e);
        }
    }

    async fetchIndexes() {
        try {
            const seenIndexes = await axios.get('/api/values/all');
            if (Array.isArray(seenIndexes.data)) {
                this.setState({
                    seenIndexes: seenIndexes.data,
                });
            } else {
                this.setState({ seenIndexes: [] });
                console.error(`'Data that come from the API is of type ${typeof(seenIndexes.data)}. Expected an Array'`);
            }
        } catch (e) {
            this.setState({ seenIndexes: [] });
            console.error(e);
        }
    }

    handleSubmit = async (event: SyntheticEvent) => {
        event.preventDefault();
        try {
            await axios.post('/api/values', {
                index: this.state.index,
            });
        } catch (e) {
            console.error(e);
            alert('Oops, our API server is currently unavailable');
        }
        this.setState({ index: '' });
    }

    renderSeenIndexes() {
        return this.state.seenIndexes
            .map(({ fib_index }) => fib_index)
            .join(', ');
    }

    renderValues() {
        const entries = [];
        for (let key in this.state.values) {
            entries.push(
                <div key={key}>
                    For index {key} I calculated {this.state.values[key]}
                </div>
            );
        }
        return entries;
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <label>Enter your index:</label>
                    <input
                        value={this.state.index}
                        onChange={event => this.setState({ index: event.target.value })}
                    />
                    <button>Submit</button>
                </form>
                <h3>Indexes I have seen:</h3>
                {this.renderSeenIndexes()}
                <h3>Calculated values</h3>
                {this.renderValues()}
            </div>
        );
    }
}

export default Fib;
