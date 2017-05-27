"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ViewerItem_inlined_css_1 = require("./ViewerItem.inlined.css");
class ViewerItem extends React.Component {
    render() {
        const { date, imageSrc, linkUrl, summary, title, typeSingleton } = this.props;
        const summaryMaxWords = typeSingleton.summaryMaxWords;
        const finalSummary = (summary.length > summaryMaxWords) ? summary.substring(0, summaryMaxWords).concat('...') : summary;
        const titleMaxWords = typeSingleton.titleMaxWords;
        const finalTitle = (title.length > titleMaxWords) ? title.substring(0, titleMaxWords).concat('...') : title;
        // Get JS Styles
        const InlineStyles = ViewerItem_inlined_css_1.ViewerItemCardTypeStyles(typeSingleton);
        return (React.createElement("table", { role: 'presentation', "aria-hidden": 'true', cellSpacing: 0, cellPadding: 0, width: '100%', style: InlineStyles.table },
            React.createElement("tbody", null,
                React.createElement("tr", null,
                    React.createElement("td", null,
                        React.createElement("img", { src: imageSrc, "aria-hidden": 'true', width: InlineStyles.img.maxWidth, height: InlineStyles.img.height, alt: 'alt_text', className: 'center-on-narrow', style: InlineStyles.img }))),
                React.createElement("tr", null,
                    React.createElement("td", { style: InlineStyles.title.td },
                        React.createElement("a", { target: '_blank', style: InlineStyles.title.a, href: linkUrl }, finalTitle))),
                React.createElement("tr", null,
                    React.createElement("td", { style: InlineStyles.date }, date)),
                React.createElement("tr", null,
                    React.createElement("td", { style: InlineStyles.summary }, finalSummary)))));
    }
}
exports.default = ViewerItem;
//# sourceMappingURL=ViewerItem.js.map