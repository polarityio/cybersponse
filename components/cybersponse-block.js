function addItem(items, key, value, hide) {
    if (value) {
        items.push({ key: key, value: value, hide: hide });
    }
}

polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    hasIndicators: Ember.computed('block.data.details', function () {
        return this.get('block.data.details').indicators.length > 0;
    }),
    actionStatus: {},
    indicators: Ember.computed('block.data.details', function () {
        try {
            let details = this.get('block.data.details');
            let detail = details.indicators;
            let indicators = detail.map(indicator => {
                let items = [];
                let sightings = [];
                addItem(items, 'Source', indicator.indicator.source);
                addItem(items, 'Description', indicator.indicator.description);
                if (indicator.indicator.reputation) addItem(items, 'Reputation', indicator.indicator.reputation.itemValue);

                // Sightings
                addItem(sightings, 'Alerts', indicator.sightings['alerts']);
                addItem(sightings, 'Assets', indicator.sightings['assets']);
                addItem(sightings, 'Incidents', indicator.sightings['incidents']);
                addItem(sightings, 'Emails', indicator.sightings['emails']);
                addItem(sightings, 'Events', indicator.sightings['events']);

                let matches = /^.+\/indicators\/(.+)/.exec(indicator.indicator['@id']);

                return {
                    title: indicator.indicator.typeofindicator.itemValue,
                    id: matches[1],
                    items: items,
                    sightings: sightings
                };
            });

            return indicators;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }),
    displayResult: Ember.computed('block.data.details', function () {
        try {
            let details = this.get('block.data.details');
            let detail = details.result;
            let items = [];

            addItem(items, 'Description', detail.description, true);
            addItem(items, 'Impact Assessments', detail.impactassessments, true);

            addItem(items, 'Phase', detail.phase ? detail.phase.itemValue : null);
            addItem(items, 'Category', detail.category ? detail.category.itemValue : null);
            addItem(items, 'Severity', detail.severity ? detail.severity.itemValue : null);
            addItem(items, 'Indicator Status', detail.status ? detail.status.itemValue : null);

            addItem(items, 'Number of Alerts', details.numberOfAlerts);
            if (detail.incidentLead && detail.incidentLead.firstname) {
                items.push({ key: 'Incident Lead', value: detail.incidentLead.firstname + ' ' + detail.incidentLead.lastname });
            }
            items.push({ key: 'Created By', value: detail.createUser.firstname + ' ' + detail.createUser.lastname });
            if (detail.modifyUser && detail.modifyUser.firstname) {
                items.push({ key: 'Modified By', value: detail.modifyUser.firstname + ' ' + detail.modifyUser.lastname });
            }

            let matchs = /^.+\/incidents\/(.+)/.exec(detail['@id']);
            return {
                name: detail.name,
                items: items,
                alert: detail,
                id: matchs[1]
            };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }),
    host: Ember.computed('block.data.details', function () {
        let details = this.get('block.data.details');
        return details.host;
    }),
    actions: {
        invokePlaybook: function (action, alert) {
            this.sendIntegrationMessage({ action: action, alert: alert })
                .then(() => {
                    let details = this.get('block.data.details');
                    let match = details.actions
                        .filter(candidate => candidate.name === action.name)
                        .pop();

                    match.success = true;

                    this.set('block.data.details', details);
                    this.notifyPropertyChange('block.data.details');
                })
                .catch(err => {
                    console.error(err);

                    let details = this.get('block.data.details');
                    let match = details.actions
                        .filter(candidate => candidate.name === action.name)
                        .pop();

                    match.error = true;

                    this.set('block.data.details', details);
                    this.notifyPropertyChange('block.data.details');
                });
        }
    }
});
