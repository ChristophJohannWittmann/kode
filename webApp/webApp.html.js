
            const txx = ${apptext};
            Object.freeze(txx);

            const webAppSettings = {
                verify: () => false,
                password: () => false,
                container: () => ${container},
                homeView: () => ${container}.mk${homeView}(),
                session: () => null,
                url: () => '${url}',
                websocket: () => ${websocket},
            };
