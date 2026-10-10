import { useEffect, useState } from 'react';
import { getRoute, type Route } from './routes';

export function useRoute() {
    const [route, setRoute] = useState<Route>(() => getRoute(window.location.pathname));

    useEffect(() => {
        const onPopState = () => setRoute(getRoute(window.location.pathname));
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    return [route, setRoute] as const;
}
