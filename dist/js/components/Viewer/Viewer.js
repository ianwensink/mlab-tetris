"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ViewerItem_1 = require("../ViewerItem/ViewerItem");
/* tslint:disable-next-line:no-var-requires */
const styles = require('./Viewer.module.css');
// Since TypeScript 2.3 it doesn´t import ViewerItemCardType on this way we need to use require
// import {ViewerItemCardType} from "../ViewerItem/ViewerItemCardType";
/* tslint:disable-next-line:no-var-requires */
const cardType = require('../ViewerItem/ViewerItemCardType');
/* tslint:enable:no-var-requires */
class Viewer extends React.Component {
    render() {
        const { id, article } = this.props;
        return (React.createElement("section", { id: id, className: styles.container },
            React.createElement("div", { className: styles.big },
                React.createElement(ViewerItem_1.default, Object.assign({}, article, { typeSingleton: cardType.ViewerItemCardType.Big }))),
            React.createElement("div", { className: styles.medium },
                React.createElement(ViewerItem_1.default, Object.assign({}, article, { typeSingleton: cardType.ViewerItemCardType.Medium }))),
            React.createElement("div", { className: styles.small },
                React.createElement(ViewerItem_1.default, Object.assign({}, article, { typeSingleton: cardType.ViewerItemCardType.Small })))));
    }
}
exports.default = Viewer;
//# sourceMappingURL=Viewer.js.map