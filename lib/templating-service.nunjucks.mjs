import nunjucks from 'nunjucks';
import memoize from 'mem';
import util from 'util';

import { logger } from './logging';

const renderString = util.promisify(nunjucks.compile);

const __retrieveTemplate = async (str) => {
    logger.debug("Making template for %s", str);
    return await nunjucks.compile(str);
}

const _retrieveTemplate = memoize(__retrieveTemplate);

const NunjucksTemplatingService = {
    render: async (str, context) => {
        logger.debug(context, "Render template for %s", str);
        const template = await _retrieveTemplate(str)
        return template.render(context);
    }
}

export {
    NunjucksTemplatingService
}