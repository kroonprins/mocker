import nunjucks from 'nunjucks';
import util from 'util';

const renderString = util.promisify(nunjucks.renderString);

const TemplatingService = {
    render: async (str, context) => {
        return await renderString(str, context);
    }
}

export { TemplatingService };