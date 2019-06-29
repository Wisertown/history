import React from "react";
import Header from "../Layout/Header";
import LeftNav from "../Layout/LeftNav";
import ajaxCall from "../utility/ajaxCall";
import Violation from "./Cards/Violation";
import Comment from "./Cards/Comment";
import Action from "./Cards/Action";
import {library} from '@fortawesome/fontawesome-svg-core'
import {faInfoCircle, faExclamationCircle, faChevronLeft} from "@fortawesome/free-solid-svg-icons/";
import {faTimesCircle} from "@fortawesome/free-regular-svg-icons/";

const queryString = require('query-string');

library.add(faTimesCircle, faInfoCircle, faExclamationCircle,  faChevronLeft );
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import universalFunctions from '../utility/UniversalFunctions';
import {NavLink} from "react-router-dom";
import {faArchive} from "../TagsInViolation/TagsInViolation";
const styles = theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: '#e6eaf5',
    },
    tabsRoot: {
        borderBottom: '3px solid #0076cd',
    },
    tabsIndicator: {
        backgroundColor: '#ffffff',
    },

});

class History extends React.Component {
    constructor(props) {
        super(props);

        const filters = queryString.parse(location.search);
        this.state = {
            title: 'Violation History',
            md5sum: filters.md5sum ? filters.md5sum : '',
            name: (this.props.location && this.props.location.state && this.props.location.state.name ? this.props.location.state.name : ''),
            leftNav: {
                policies: false,
                reports: false,
                tags: false,
            },
            state:"all",
            events: null,
            nextTimeframe: [],
            eventComponents: '',
            startDate: '',
            endDate: '',
            priority: 'all',
            eventType: {
                violations: true,
                actions: true,
                comments: true,
            }
        };
        this.handleGoBack.bind(this);
    }

    handlePriorityChange = (event, value) => {
        this.setState({
            priority: event.target.value,
        });
    };

    /**
     * Fetch the stats on load
     */
    componentDidMount() {
        this.getHistory();
    };

    getFilters() {
        let queryParams = {};

        queryParams.controller = 'tagmanager/history';
        queryParams.md5sum = this.state.md5sum;
        queryParams.start_date = this.state.startDate;
        queryParams.end_date = this.state.endDate;
        queryParams.omit_tag = (this.state.name === '' ? 'f' : 't');

        return queryParams;
    };

    getHistory() {
        let handleResponse = responseData => {
            if(responseData !== undefined) {
                let state = {};

                if (this.state.events && typeof this.state.events === 'object') {
                    state.events = {...this.state.events, ...responseData.events};
                } else {
                    state.events = responseData.events;
                }

                if (responseData.name) {
                    state.name = responseData.name;
                }

                state.nextTimeframe = responseData.nextTimeframe;
                state.startDate = responseData.nextTimeframe[0];
                state.endDate = responseData.nextTimeframe[1];
                this.setState(state);
                universalFunctions.sendEventGoogleA("History", "Load More", 1);
            }
        };

        let queryParams = this.getFilters();
        new Promise(() => {
            ajaxCall
                .get(queryParams)
                .then(responseData => handleResponse(responseData));
        });
    };

    handleGoBack = (e) => {
        this.props.history.goBack();
    };

    isViolationFiltered(priority) {
        let filtered = false;

        if (this.state.eventType.violations !== true) {
            return true;
        }

        if (this.state.priority === 'all') {
            return false;
        }

        if (parseInt(priority) !== parseInt(this.state.priority)) {
            filtered = true;
        }

        return filtered;
    }

    /**
     * Key needs to update in order to force the component to update.
     */
    mapEventComponent() {
        if (!this.state.events || typeof this.state.events !== 'object') {
            return;
        }

        let days = this.state.events;

        this.state.eventComponents = Object.keys(this.state.events).map((day) => {
            return (
                <div data-label={days[day].label} key={days[day].label} className="tag_tags_data">
                    <div className="date_cap">{days[day].label}</div>
                    {days[day].data.map((data, index) => {
                        if (data.eventType === 'comment') {
                            let style = this.state.eventType.comments === true ? {display: "block"} : {display: "none"};
                            return <div style={style} key={index} className="timeline_container left"><Comment data={data}/></div>;
                        } else {
                            if (data.eventType === 'action') {
                                let style = this.state.eventType.actions === true ? {display: "block"} : {display: "none"};
                                return <div style={style} key={index} className="timeline_container left"><Action data={data}/></div>;
                            } else {
                                if (data.eventType === 'violation') {
                                    let style = !this.isViolationFiltered(data.priority) === true ? {display: "block"} : {display: "none"};
                                    return <div style={style} key={index + style} className="timeline_container right"><Violation md5sum={this.state.md5sum} priorityFilter={this.state.priority} data={data}/></div>;
                                }
                            }
                        }
                    })}
                </div>
            )
        });
    }

    handleEventTypeChange = (event) => {
        let state = {};
        state.eventType = this.state.eventType;
        state.eventType[event.target.name] = event.target.checked;
        this.setState(state);
    };

    render() {
        this.mapEventComponent();

        return (

            <div>
                <Header titleCallback={this.defineTheTitleInHeader} title={this.state.title} key={this.state.title}/>

                <div className="mdh_main">
                    <LeftNav leftNavData={this.state.leftNav} key={this.state.title}/>
                    <div className="mdh_viewp mec_viewp" id="mdh_viewp" style={{paddingLeft: '20px', paddingRight: '20px'}}>
                        <div className="check_options_row">
                            <div className="t_check_option">
                                <div className="">
                                    <div className="t_check">
                                        <button onClick={this.handleGoBack} className="back_btn"><FontAwesomeIcon icon={faChevronLeft}/> Back</button>
                                    </div>

                                    <div style={{marginLeft: '50px', display: 'inline-block'}}>
                                        <div className="t_check">
                                            <label className="t_check_container">
                                                All Violations
                                                <input name="violations" onChange={this.handleEventTypeChange.bind(this)} value={this.state.eventType.violations} checked={this.state.eventType.violations === true} type="checkbox"/>
                                                <span className="checkmark"/>
                                            </label>
                                        </div>
                                        <div className="t_check">
                                            <label className="t_check_container">
                                                Actions
                                                <input name="actions" onChange={this.handleEventTypeChange.bind(this)} value={this.state.eventType.actions} checked={this.state.eventType.actions === true} type="checkbox"/>
                                                <span className="checkmark"/>
                                            </label>
                                        </div>
                                        <div className="t_check" style={{display: 'none'}}>
                                            <label className="t_check_container">
                                                Comments
                                                <input name="comments" onChange={this.handleEventTypeChange.bind(this)} value={this.state.eventType.comments} checked={this.state.eventType.comments === true} type="checkbox"/>
                                                <span className="checkmark"/>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{backgroundColor: '#ffffff', padding: '20px'}}>
                            <div className="t_header">{this.state.name}</div>
                            <div className="t_sub">Violation History</div>
                            <div>
                                    <div className="history_filter">
                                        <div className="history_filter_bar">
                                            <button name="priority" value="all" onClick={this.handlePriorityChange.bind(this)} className={this.state.priority === 'all' ? 'filter active' : 'filter'}>All</button>
                                            <button name="priority" value="100" onClick={this.handlePriorityChange.bind(this)} className={this.state.priority === '100' ? 'filter active' : 'filter'}>Malware</button>
                                            <button name="priority" value="50" onClick={this.handlePriorityChange.bind(this)} className={this.state.priority === '50' ? 'filter active' : 'filter'}>High</button>
                                            <button name="priority" value="30" onClick={this.handlePriorityChange.bind(this)} className={this.state.priority === '30' ? 'filter active' : 'filter'}>Medium</button>
                                            <button name="priority" value="10" onClick={this.handlePriorityChange.bind(this)} className={this.state.priority === '10' ? 'filter active' : 'filter'}>Low</button>
                                        </div>
                                    </div>
                                <div className="mdh_box_views">
                                    <div className="timeline">
                                        {this.state.eventComponents}
                                    </div>
                                    <button className="btn load_more" onClick={this.getHistory.bind(this)}>Load More</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default (History);


