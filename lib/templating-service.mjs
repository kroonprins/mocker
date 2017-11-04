import { logger } from './logging';
import { NunjucksTemplatingService } from './templating-service.nunjucks';

const TEMPLATING_ENGINES = {
    none : {
        service: {
            render: async (str, context) => {
                return str;
            }
        }
    },
    nunjucks: {
        service: NunjucksTemplatingService
    }
}

const TemplatingService = {
    render: async (templatingEngine, str, context) => {
        logger.debug(context, "Render template for templating engine %s", templatingEngine);
        if(!templatingEngine || ! (templatingEngine in TEMPLATING_ENGINES)) {
            throw new Error(`Unknown templating engine ${templatingEngine}`);
        }
        return await TEMPLATING_ENGINES[templatingEngine].service.render(str, context);
    },
    listEngines: async () => {
        return Object.keys(TEMPLATING_ENGINES);
    }
}

export {
    TemplatingService
}