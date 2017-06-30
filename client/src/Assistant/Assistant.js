// @flow

import React from 'react';
import autoBind from 'react-autobind';
import { FormattedMessage, FormattedDate } from 'react-intl';

import Introduction from './Introduction';
import IntermediateResult from './IntermediateResult';

import LeaseCreatedInput from '../InputComponents/LeaseCreatedInput';
import RentInput from '../InputComponents/RentInput';
import AddressInput from '../InputComponents/AddressInput';
import NewBuildingInput from '../InputComponents/NewBuildingInput';
import ConstructionDateInput from '../InputComponents/ConstructionDateInput';
import SquareMetersInput from '../InputComponents/SquareMetersInput';
import BaseFeaturesInput from '../InputComponents/BaseFeaturesInput';
import SpecialFeaturesInput from '../InputComponents/SpecialFeaturesInput';

import RangeSelectionGroup from '../RangeInputComponents/RangeSelectionGroup';
import * as BathFeatures from '../RangeInputComponents/BathFeatures';

import './Assistant.css';

const Header = (props) => {
  const style = {
    main: {
      marginBottom: "2em"
    },
    items: {
      marginRight: 5
    }
  }
  return <section style={style.main}>
    <span style={style.items}>#{props.serialNumber}</span>
    <span style={style.items}>Step {props.stage + 1}/11</span>
    <span style={style.items}><FormattedDate value={new Date()} /></span>
  </section>;
}

class Assistant extends React.Component {
	state = {
		stage: 1,
		serialNumber: "03",
    inputValid: {},
    inputData: {
      "leaseCreated": "2006-05-12",
      "rent": 1000,
      "address": "Wittelsbacherstraße 5, 10707 Berlin, Deutschland",
      "addressPlace": "ChIJ2waGHO5QqEcR_LHKINnI5z0",
      "newBuilding": false,
      "constructionDate": null,
      "constructionDateGuessed": "Pre1949",
      "squareMeters": null,
      "squareMetersGuessed": "lt90",
      "baseFeatures": "default",
      "intermediateResult": {
        "sufficientData": true,
        "rentLevel": 5.43,
        "lowerBound": 4.13,
        "upperBound": 7.42
      }
    }
	}

	constructor(props: {}) {
		super(props);
		autoBind(this);
	}

	handleContinue(e: Event) {
		this.setState({stage: (this.state.stage + 1)});
	}

	handleInputValid(name: string, valid: boolean) {
    const newInputValid = Object.assign(this.state.inputValid, {[name]: valid});
    this.setState({inputValid: newInputValid});
	}

	handleInputChanged(newData: Object) {
    this.setState({inputData: Object.assign({}, this.state.inputData, newData)});
    Object.keys(newData).map(k => console.log(k, newData[k]));
	}

  stageValid(fieldNames: Array<string>) {
    return fieldNames.map(k => this.state.inputValid[k] === true).every(v => v === true);
  }

	render() {
		let content;
    let conditions: Array<string> = [];

		const valid = this.handleInputValid;
		const changed = this.handleInputChanged;

    const data = JSON.stringify(this.state.inputData, null, 2);

		switch(this.state.stage) {
			case 1:
        content = <div>
          <LeaseCreatedInput valid={valid} changed={changed} />
          <RentInput valid={valid} changed={changed} />
          <AddressInput valid={valid} changed={changed} />
        </div>;
        conditions = ["leaseCreated", "rent", "address"];
				break;

			case 2:
				content = <div>
					<NewBuildingInput valid={valid} changed={changed} />
					<ConstructionDateInput valid={valid} changed={changed} />
					<SquareMetersInput valid={valid} changed={changed} />
          <BaseFeaturesInput valid={valid} changed={changed} />
				</div>;
        conditions = ["newBuilding", "constructionDate", "squareMeters", "baseFeatures"];
				break;

      case 3:
        // Mietspiegelabfrage, ob genug Daten vorhanden sind
        conditions = ["intermediateResult"];
        content = <IntermediateResult 
          valid={valid}
          changed={changed}
          {...this.state.inputData}
        />;
        break;

      case 4:
        // Let component add to validity conditions of current stage
        conditions = ["specialFeatures"];
        content = <SpecialFeaturesInput 
          constructionDate={this.state.inputData.constructionDate} 
          constructionDateGuessed={this.state.inputData.constructionDateGuessed} 
          valid={valid} 
          changed={changed} />;
        break;

      case 5:
        content = <div>
          <h1>
            <FormattedMessage
              id="Bath.Header"
              defaultMessage="Badezimmer und WC" />
          </h1>
          <RangeSelectionGroup 
            domain="BathGroup"
            inputComponents={BathFeatures}
            changed={changed} 
            />
        </div>;
        break;

			case 0:
			default:
				content = <Introduction serialNumber={this.state.serialNumber} />;
		}

		return <div className="assistant">
      <Header serialNumber={this.state.serialNumber} stage={this.state.stage} />
      {content}
      <button onClick={this.handleContinue} disabled={!this.stageValid(conditions)}>
      	<FormattedMessage
      		id="Assistant.continue"
      		defaultMessage="Weiter"
      	/>
      </button>
      <div><pre>{data}</pre></div>
		</div>;
	}
}

export default Assistant;