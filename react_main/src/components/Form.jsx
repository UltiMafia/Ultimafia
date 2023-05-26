import React, { useState, useReducer, useRef, useEffect } from "react";
import { ChromePicker } from "react-color";
import  DatePicker  from "react-date-picker";
import ReactMde from "react-mde";
import ReactMarkdown from "react-markdown";
import axios from "axios";

import { useOnOutsideClick } from "./Basic";
import { useErrorAlert } from "./Alerts";

import "react-mde/lib/styles/css/react-mde.css";
import "react-mde/lib/styles/css/react-mde-editor.css";
import "react-mde/lib/styles/css/react-mde-toolbar.css";
import "react-mde/lib/styles/css/react-mde-suggestions.css";

import "../css/form.css";
import "../css/markdown.css";
import { dateToHTMLString } from "../utils";

export default function Form(props) {
	function onChange(event, field, localOnly) {
		var value = event.target.value;

		if (field.min != null && Number(value) < field.min)
			value = field.min;
		else if (field.max != null && Number(value) > field.max)
			value = field.max;

		props.onChange({
			ref: field.ref,
			prop: "value",
			value: value,
			localOnly
		});
	}

	function onDChange(date, field, localOnly) {
		var value = new Date(date);

		props.onChange({
			ref: field.ref,
			prop: "value",
			value: value,
			localOnly
		});
	}

	const formFields = props.fields.map((field, i) => {
		const disabled = typeof field.disabled == "function" ? field.disabled(props.deps) : field.disabled;
		const fieldWrapperClass = `field-wrapper ${disabled ? "disabled" : ""}`;
		var showIf;

		if (typeof field.showIf == "string")
			showIf = [field.showIf];
		else
			showIf = field.showIf;

		if (Array.isArray(showIf)) {
			for (let ref of showIf) {
				let inverted = ref[0] == "!";

				if (inverted)
					ref = ref.slice(1);

				for (let field of props.fields) {
					if (field.ref == ref && field.type == "boolean") {
						let value = field.value == true;

						if ((value ^ inverted) == 0)
							return;

						break;
					}
				}
			}
		}
		else if (typeof showIf == "function")
			if (!showIf(props.deps))
				return;

		const value = typeof field.value == "function" ? field.value(props.deps) : field.value;

		switch (field.type) {
			case "text":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						{field.type == "text" && field.textStyle == "large" 
						? <textarea
							value={value || ""}
							placeholder={field.placeholder}
							disabled={disabled}
							onChange={(e) => !field.fixed && onChange(e, field, field.saveBtn)}
							onClick={(e) => field.highlight && e.target.select()} />
						: <input
							type={field.type}
							value={value || ""}
							placeholder={field.placeholder}
							disabled={disabled}
							onChange={(e) => !field.fixed && onChange(e, field, field.saveBtn)}
							onClick={(e) => field.highlight && e.target.select()} />
						}
						{field.saveBtn && props.deps[field.saveBtnDiffer] != field.value &&
							<div
								className="btn btn-theme extra"
								onClick={(e) => {
									let conf = !field.confirm || window.confirm(field.confirm);

									if (conf) {
										if (field.saveBtnOnClick)
											field.saveBtnOnClick(field.value, props.deps);
										else
											onChange(e, field);
									}
								}}>
								{field.saveBtn}
							</div>
						}
					</div>
				);
			case "number":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<input
							type="number"
							value={field.value || "0"}
							min={field.min}
							max={field.max}
							step={field.step}
							disabled={disabled}
							onChange={(e) => onChange(e, field)} />
					</div>
				);
			case "boolean":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<div className="switch-wrapper">
							<Switch
								value={field.value || false}
								disabled={disabled}
								onChange={e => onChange(e, field)} />
						</div>
					</div>
				);
			case "select":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<select
							value={field.value || field.options[0].ref}
							disabled={disabled}
							onChange={e => onChange(e, field)}>
							{
								field.options.map(option => (
									<option value={option.value} key={option.value}>
										{option.label}
									</option>
								))
							}
						</select>
					</div>
				);
			case "range":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<div className="range-wrapper">
							<input
								type="range"
								min={field.min}
								max={field.max}
								step={field.step}
								value={field.value}
								disabled={disabled}
								onChange={e => onChange(e, field)} />
						</div>
					</div>
				);
			case "color":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<ColorPicker
							value={field.value}
							default={field.default}
							alpha={field.alpha}
							disabled={disabled}
							onChange={e => onChange(e, field)} />
						{!field.noReset && field.value != field.default && field.value &&
							<div
								className="btn btn-theme extra"
								onClick={() => onChange({ target: { value: field.default } }, field)}>
								Reset
							</div>
						}
					</div>
				);
			case "date":
				if (field.value === "undefined") {
					field.value = undefined
				}

				let selectedValue = props.deps.user[field.ref];
				if (selectedValue === "undefined") {
					selectedValue = undefined
				}

				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<DatePicker
							format='MMMM dd'
							calendarAriaLabel="Toggle calendar"
							clearAriaLabel="Clear value"
							dayAriaLabel="Day"
							monthAriaLabel="Month"
							nativeInputAriaLabel="Date"
							onChange={e => onDChange(e, field, true)}
							value={field.value || selectedValue || new Date()}
							maxDetail="month"
						/>
						{field.saveBtn && !props.deps.user[field.saveBtnDiffer] &&
							<div
								className="btn btn-theme extra"
								onClick={(e) => {
									let conf = !field.confirm || window.confirm(field.confirm);

									if (conf) {
										if (field.saveBtnOnClick)
											field.saveBtnOnClick(field.value || field.default, props.deps);
										else
											onDChange(e, field, true);
									}
								}}>
								{field.saveBtn}
							</div>
						}
					</div>
				);
			case "datetime-local":
				return (
					<div className={fieldWrapperClass} key={field.ref}>
						<div className="label">
							{field.label}
						</div>
						<div className="datetime-wrapper">
							<input
								type="datetime-local"
								min={dateToHTMLString(field.min)}
								max={dateToHTMLString(field.max)}
								value={dateToHTMLString(field.value)}
								disabled={disabled}
								onChange={e => onChange(e, field)} />
						</div>
					</div>
				);
		}
	});

	return (
		<div className="form">
			{formFields}
			{props.submitText &&
				<div
					className="btn btn-theme-sec"
					onClick={props.onSubmit}>
					{props.submitText}
				</div>
			}
		</div>
	);
}

function Switch(props) {
	return (
		<div
			className={`switch ${props.value ? "on" : ""}`}
			onClick={() => !props.disabled && props.onChange({ target: { value: !props.value } })}>
			<div className="track" />
			<div className="thumb" />
			<input
				type="hidden"
				value={props.value} />
		</div>
	);
}

function ColorPicker(props) {
	const [picking, setPicking] = useState(false);
	const pickerRef = useRef();
	const value = props.value || props.default;
	const disabled = props.disabled;

	function onClick(e) {
		if (!disabled && e.target == pickerRef.current)
			setPicking(!picking);
	}

	function onChangeComplete(color, event) {
		props.onChange({ target: { value: color.hex } });
	}

	useOnOutsideClick(pickerRef, () => setPicking(false));

	return (
		<div
			className={`color-picker ${disabled ? "disabled" : ""}`}
			style={{ backgroundColor: value }}
			onClick={onClick}
			ref={pickerRef}>
			{picking &&
				<ChromePicker
					color={value}
					disableAlpha={!props.alpha}
					onChangeComplete={onChangeComplete} />
			}
		</div>
	);
}

export function HiddenUpload(props) {
	const inputRef = useRef();

	function onClick() {
		var shouldInput = true;

		if (props.onClick)
			shouldInput = props.onClick();

		if (shouldInput)
			showFileUploadDialog();
	}

	function showFileUploadDialog() {
		inputRef.current.click();
	}

	return (
		<div
			className={props.className}
			onClick={onClick}>
			{props.children}
			<input
				className="hidden-upload"
				ref={inputRef}
				type="file"
				onChange={e => props.onFileUpload(e.target.files, props.name)} />
		</div>
	);
}

export function useForm(initialFormFields) {
	const [initFields] = useState(initialFormFields);
	const [fields, updateFields] = useReducer((formFields, actions) => {
		const newFormFields = [...formFields];

		if (!Array.isArray(actions))
			actions = [actions];

		for (let i in newFormFields) {
			let field = newFormFields[i];
			let newField = { ...field };

			for (let action of actions) {
				if (field.ref && field.ref == action.ref) {
					if (typeof action.value == "string" && field.type == "boolean")
						action.value = action.value == "true";

					newField[action.prop] = action.value;
					break;
				}
			}

			newFormFields[i] = newField;
		}

		return newFormFields;
	}, initialFormFields);

	function resetFields() {
		var updates = [];

		for (let field of initFields) {
			updates.push({
				ref: field.ref,
				prop: "value",
				value: field.value
			});
		}

		updateFields(updates);
	}

	return [fields, updateFields, resetFields];
}

export function SearchSelect(props) {
	const value = props.value;
	const setValue = props.setValue;

	const [inputValue, setInputValue] = useState("");
	const [optionsVisible, setOptionsVisible] = useState(false);
	const [hoveringOptions, setHoveringOptions] = useState(false);
	const [matchingOptions, setMatchingOptions] = useState(props.options);
	const searchSelectRef = useRef();
	const optionsRef = useRef();

	useEffect(() => {
		if (!optionsVisible)
			return;

		const searchSelectRect = searchSelectRef.current.getBoundingClientRect();
		const optionsRect = optionsRef.current.getBoundingClientRect();

		var optionsTop = searchSelectRect.top + searchSelectRect.height + 1;

		if (optionsTop + optionsRect.height > window.innerHeight)
			optionsTop = searchSelectRect.top - optionsRect.height - 2;

		optionsRef.current.style.top = optionsTop + "px";
		optionsRef.current.style.visibility = "visible";
	});

	useEffect(() => {
		if (inputValue == "")
			setMatchingOptions(props.options);
		else {
			var options = props.options.filter(option => (
				option.toLowerCase().includes(inputValue.toLowerCase())
			));

			setMatchingOptions(options);
		}
	}, [inputValue, props.options]);

	const options = matchingOptions.map(option => (
		<div
			className="option-row"
			onClick={() => onOptionClick(option)}
			key={option}>
			{option}
		</div>
	));

	function onOptionClick(option) {
		setValue(option);
		setInputValue("");
		setOptionsVisible(false);
		setHoveringOptions(false);

		if (props.onChange)
			props.onChange(option);
	}

	function onKeyDown(e) {
		if (e.key == "Enter") {
			setValue(matchingOptions[0]);
			setInputValue("");
			setOptionsVisible(false);
			setHoveringOptions(false);

			if (props.onChange)
				props.onChange(matchingOptions[0]);
		}
		else if (!optionsVisible)
			setOptionsVisible(true);
	}

	function onMouseEnterOptionsList() {
		setHoveringOptions(true);
	}

	function onMouseLeaveOptionsList() {
		setHoveringOptions(false);
	}

	function onInputChange(e) {
		setInputValue(e.target.value);

		if (props.onInputChange)
			props.onInputChange(e);
	}

	function onSelectFocus() {
		setOptionsVisible(true);
	}

	function onSelectBlur() {
		if (hoveringOptions)
			return;

		setOptionsVisible(false);
		setInputValue("");
		setMatchingOptions(props.options);
	}

	return (
		<div
			className="search-select"
			tabIndex="0"
			onFocus={onSelectFocus}
			onBlur={onSelectBlur}
			ref={searchSelectRef}>
			<input
				value={inputValue}
				placeholder={value || props.placeholder}
				onChange={onInputChange}
				onKeyDown={onKeyDown} />
			<div className="icon-wrapper">
				<i className="fas fa-chevron-down" />
			</div>
			{optionsVisible &&
				<div
					className="option-list"
					onMouseEnter={onMouseEnterOptionsList}
					onMouseLeave={onMouseLeaveOptionsList}
					ref={optionsRef}>
					{options.length > 0 &&
						options
					}
					{!options.length &&
						<div className="no-options">
							No Options
						</div>
					}
				</div>
			}
		</div>
	);
}

export function UserSearchSelect(props) {
	const [options, setOptions] = useState([]);
	const [idMap, setIdMap] = useState({});
	const [query, setQuery] = useState("");
	const [valueName, setValueName] = useState("");

	useEffect(() => {
		if (query.length == 0)
			return;

		axios.get(`/user/searchName?query=${query}`)
			.then(res => {
				var newIdMap = {};

				for (let userData of res.data)
					newIdMap[userData.name] = userData.id;

				setIdMap(newIdMap);
				setOptions(res.data.map(user => user.name));
			})
			.catch(useErrorAlert);
	}, [query]);

	function setValue(option) {
		setValueName(option);
		props.setValue(idMap[option]);
	}

	function onInputChange(e) {
		setQuery(e.target.value);
	}

	return (
		<SearchSelect
			{...props}
			options={options}
			value={valueName}
			setValue={setValue}
			onInputChange={onInputChange} />
	);
}

export function TextEditor(props) {
	const [tab, setTab] = useState("write");

	return (
		<ReactMde
			value={props.value}
			onChange={props.onChange}
			selectedTab={tab}
			onTabChange={setTab}
			classes={{ "preview": "md-content" }}
			generateMarkdownPreview={
				(markdown) => Promise.resolve(<ReactMarkdown source={markdown} />)
			} />
	);
}