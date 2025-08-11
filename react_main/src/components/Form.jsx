import React, { useState, useReducer, useRef, useEffect } from "react";
import { ChromePicker } from "react-color";
import DatePicker from "react-date-picker";
import ReactMde from "react-mde";
import ReactMarkdown from "react-markdown";
import axios from "axios";

import { basicRenderers, useOnOutsideClick } from "./Basic";
import { useErrorAlert } from "./Alerts";

import "react-mde/lib/styles/css/react-mde.css";
import "react-mde/lib/styles/css/react-mde-editor.css";
import "react-mde/lib/styles/css/react-mde-toolbar.css";
import "react-mde/lib/styles/css/react-mde-suggestions.css";

import "css/form.css";
import "css/markdown.css";
import { dateToHTMLString } from "../utils";
import { colorHasGoodBackgroundContrast } from "../shared/colors";
import {
  Autocomplete,
  TextField,
  Select,
  MenuItem,
  Slider,
  Button,
  Box,
  Grid,
  IconButton,
} from "@mui/material";

export default function Form(props) {
  function onChange(event, field, localOnly) {
    var value = event.target.value;

    if (field.min != null && Number(value) < field.min) value = field.min;
    else if (field.max != null && Number(value) > field.max) value = field.max;

    props.onChange({
      ref: field.ref,
      prop: "value",
      value: value,
      localOnly,
    });
  }

  function onDChange(date, field, localOnly) {
    var value = new Date(date);

    props.onChange({
      ref: field.ref,
      prop: "value",
      value: value,
      localOnly,
    });
  }

  const formFields = props.fields.map((field, i) => {
    const disabled =
      typeof field.disabled == "function"
        ? field.disabled(props.deps)
        : field.disabled;
    const fieldWrapperClass = `field-wrapper ${disabled ? "disabled" : ""}`;
    var showIf;

    if (typeof field.showIf == "string") showIf = [field.showIf];
    else showIf = field.showIf;

    if (Array.isArray(showIf)) {
      for (let ref of showIf) {
        let inverted = ref[0] === "!";

        if (inverted) ref = ref.slice(1);

        for (let field of props.fields) {
          if (field.ref === ref && field.type === "boolean") {
            let value = field.value === true;

            if ((value ^ inverted) === 0) return;

            break;
          }
        }
      }
    } else if (typeof showIf == "function") if (!showIf(props.deps)) return;

    const value =
      typeof field.value == "function" ? field.value(props.deps) : field.value;

    const ExtraInfo = !field?.extraInfo ? null : (
      <Box sx={{ p: 0.5, color: "#BBB" }}>{field?.extraInfo}</Box>
    );
    switch (field.type) {
      case "text":
        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            {field.type === "text" && field.textStyle === "large" ? (
              <textarea
                value={value || ""}
                placeholder={field.placeholder}
                disabled={disabled}
                onChange={(e) =>
                  !field.fixed && onChange(e, field, field.saveBtn)
                }
                onClick={(e) => field.highlight && e.target.select()}
              />
            ) : (
              <input
                type={field.type}
                value={value || ""}
                placeholder={field.placeholder}
                disabled={disabled}
                onChange={(e) =>
                  !field.fixed && onChange(e, field, field.saveBtn)
                }
                onClick={(e) => field.highlight && e.target.select()}
              />
            )}
            {field.saveBtn &&
              props.deps[field.saveBtnDiffer] !== field.value && (
                <div
                  className="btn btn-theme extra"
                  onClick={(e) => {
                    let conf = !field.confirm || window.confirm(field.confirm);

                    if (conf) {
                      if (field.saveBtnOnClick)
                        field.saveBtnOnClick(field.value, props.deps);
                      else onChange(e, field);
                    }
                  }}
                >
                  {field.saveBtn}
                </div>
              )}
            {ExtraInfo}
          </div>
        );
      case "emoteUpload":
        const yourEmotes = Object.keys(value).map((key) => (
          <div className="existing-custom-emote">
            <div>{key}</div>
            <div
              className="emote"
              title={key}
              style={{
                backgroundImage: `url('/${value[key].path}')`,
              }}
            />
            <IconButton
              onClick={() =>
                field.onCustomEmoteDelete(value[key].id, props.deps)
              }
            >
              <i className="fas fa-trash" />
            </IconButton>
          </div>
        ));
        return (
          <>
            <EmoteUpload
              id="emote-upload"
              disabled={disabled}
              deps={props.deps}
              field={field}
              fieldWrapperClass={fieldWrapperClass}
            />
            <div>Your Custom Emotes:</div>
            <div className="your-emotes">{yourEmotes}</div>
          </>
        );
      case "number":
        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            <input
              type="number"
              value={field.value || "0"}
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={disabled}
              onChange={(e) => onChange(e, field)}
            />
          </div>
        );
      case "boolean":
        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            <div className="switch-wrapper">
              <Switch
                value={field.value || false}
                disabled={disabled}
                onChange={(e) => onChange(e, field)}
              />
            </div>
          </div>
        );
      case "select":
        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            <select
              value={field.value || field.options[0].ref}
              disabled={disabled}
              onChange={(e) => onChange(e, field)}
            >
              {field.options.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      case "range":
        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            <div className="range-wrapper">
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                disabled={disabled}
                onChange={(e) => onChange(e, field)}
              />
            </div>
          </div>
        );
      case "color":
        return (
          <>
            {ExtraInfo}
            <div className={fieldWrapperClass} key={field.ref}>
              <div className="label">{field.label}</div>
              <ColorPicker
                value={field.value}
                default={field.default}
                alpha={field.alpha}
                disabled={disabled}
                onChange={(e) => onChange(e, field)}
                fieldRef={field.ref}
              />
              {!field.noReset &&
                field.value !== field.default &&
                field.value && (
                  <div
                    className="btn btn-theme extra"
                    onClick={() =>
                      onChange({ target: { value: field.default } }, field)
                    }
                  >
                    Reset
                  </div>
                )}
            </div>
          </>
        );
      case "date":
        if (field.value === "undefined") {
          field.value = undefined;
        }

        let selectedValue = props.deps.user[field.ref];
        if (selectedValue === "undefined") {
          selectedValue = undefined;
        }

        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            <DatePicker
              format="MMMM dd"
              calendarAriaLabel="Toggle calendar"
              clearAriaLabel="Clear value"
              dayAriaLabel="Day"
              monthAriaLabel="Month"
              nativeInputAriaLabel="Date"
              onChange={(e) => onDChange(e, field, true)}
              value={field.value || selectedValue || new Date()}
              maxDetail="month"
            />
            {field.saveBtn && !props.deps.user[field.saveBtnDiffer] && (
              <div
                className="btn btn-theme extra"
                onClick={(e) => {
                  let conf = !field.confirm || window.confirm(field.confirm);

                  if (conf) {
                    if (field.saveBtnOnClick)
                      field.saveBtnOnClick(
                        field.value || field.default,
                        props.deps
                      );
                    else onDChange(e, field, true);
                  }
                }}
              >
                {field.saveBtn}
              </div>
            )}
          </div>
        );
      case "datetime-local":
        return (
          <div className={fieldWrapperClass} key={field.ref}>
            <div className="label">{field.label}</div>
            <div className="datetime-wrapper">
              <input
                type="datetime-local"
                min={dateToHTMLString(field.min)}
                max={dateToHTMLString(field.max)}
                value={dateToHTMLString(field.value)}
                disabled={disabled}
                onChange={(e) => onChange(e, field)}
              />
            </div>
          </div>
        );
    }
  });

  return (
    <div className="form">
      {formFields}
      {props.submitText && (
        <div className="btn btn-theme-sec" onClick={props.onSubmit}>
          {props.submitText}
        </div>
      )}
    </div>
  );
}

function Switch(props) {
  return (
    <div
      className={`switch ${props.value ? "on" : ""}`}
      onClick={() =>
        !props.disabled && props.onChange({ target: { value: !props.value } })
      }
    >
      <div className="track" />
      <div className="thumb" />
      <input type="hidden" value={props.value} />
    </div>
  );
}

function ColorPicker(props) {
  const [picking, setPicking] = useState(false);
  const pickerRef = useRef();
  const value = props.value || props.default;
  const disabled = props.disabled;

  function onClick(e) {
    if (!disabled && e.target === pickerRef.current) setPicking(!picking);
  }

  function onChangeComplete(color, event) {
    if (props.fieldRef === "nameColor" || props.fieldRef === "textColor") {
      if (colorHasGoodBackgroundContrast(color.hex)) {
        props.onChange({ target: { value: color.hex } });
      }
    } else {
      props.onChange({ target: { value: color.hex } });
    }
  }

  useOnOutsideClick(pickerRef, () => setPicking(false));

  return (
    <div
      className={`color-picker ${disabled ? "disabled" : ""}`}
      style={{ backgroundColor: value }}
      onClick={onClick}
      ref={pickerRef}
    >
      {picking && (
        <ChromePicker
          color={value}
          disableAlpha={!props.alpha}
          onChangeComplete={onChangeComplete}
        />
      )}
    </div>
  );
}

export function HiddenUpload(props) {
  const inputRef = useRef();

  function onClick() {
    var shouldInput = true;

    if (props.onClick) shouldInput = props.onClick();

    if (shouldInput) showFileUploadDialog();
  }

  function showFileUploadDialog() {
    inputRef.current.click();
  }

  return (
    <div className={props.className} onClick={onClick}>
      {props.children}
      <input
        className="hidden-upload"
        ref={inputRef}
        type="file"
        onChange={(e) => props.onFileUpload(e.target.files, props.name)}
      />
    </div>
  );
}

class EmoteUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      emoteText: "",
      imageURI: null,
      imageFilename: null,
      imageMimeType: null,
    };
  }

  buildPreview() {
    if (this.state.imageURI !== null && this.state.emoteText) {
      return (
        <>
          <div className="emote-preview">
            <div>Preview of :{this.state.emoteText}:</div>
            <div
              className="emote"
              title={this.state.emoteText}
              style={{
                backgroundImage: `url('${this.state.imageURI}')`,
              }}
            />
            <div
              className="btn btn-theme"
              onClick={(e) => {
                this.props.field.onCustomEmoteUpload(
                  this.state.emoteText,
                  this.state.imageFilename,
                  this.state.imageMimeType,
                  this.state.imageURI,
                  this.props.deps
                );
              }}
            >
              Submit
            </div>
          </div>
        </>
      );
    } else {
      return null;
    }
  }

  readURI(e) {
    if (e.target.files && e.target.files[0]) {
      let reader = new FileReader();
      let imageFilename = e.target.files[0].name;
      let imageMimeType = e.target.files[0].type;
      reader.onload = function (e) {
        this.setState({
          imageURI: e.target.result,
          imageFilename: imageFilename,
          imageMimeType: imageMimeType,
        });
      }.bind(this);
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  handleChange(e) {
    this.readURI(e);
    if (this.props.onChange !== undefined) this.props.onChange(e); // propagate to parent component
  }

  updateEmoteText(e) {
    this.setState({ emoteText: e.target.value });
  }

  render() {
    const preview = this.buildPreview();

    return (
      <>
        <div
          className={this.props.fieldWrapperClass}
          key={this.props.field.ref}
        >
          <div className="label">{this.props.field.label}</div>
          <input
            type="text"
            placeholder="your emote name here"
            maxlength={25}
            disabled={this.props.disabled}
            onChange={this.updateEmoteText.bind(this)}
          />
        </div>
        <div className="emote-upload">
          <label htmlFor={this.state.id} className="btn btn-theme">
            Upload an image
          </label>
          <input
            id={this.state.id}
            style={{ visibility: "hidden" }}
            type="file"
            onChange={this.handleChange.bind(this)}
          />
          {preview}
        </div>
      </>
    );
  }
}

export function useForm(initialFormFields) {
  const [fields, updateFields] = useReducer((formFields, actions) => {
    let newFormFields = [...formFields];

    if (!Array.isArray(actions)) actions = [actions];

    for (let i in newFormFields) {
      let field = newFormFields[i];
      let newField = { ...field };

      for (let action of actions) {
        if (action.type) {
          switch (action.type) {
            case 'setFields': {
              newFormFields = action.fields;
              break;
            }
            default: {
              throw Error('Unknown action: ' + action.type);
            }
          }
        }
        else if (field.ref && field.ref === action.ref) {
          if (typeof action.value == "string" && field.type === "boolean")
            action.value = action.value === "true";

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

    for (let field of initialFormFields) {
      updates.push({
        ref: field.ref,
        prop: "value",
        value: field.value,
      });
    }

    updateFields(updates);
  }

  return [fields, updateFields, resetFields];
}

export function UserSearchSelect(props) {
  const [options, setOptions] = useState([]);
  const [idMap, setIdMap] = useState({});
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const matchingOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    if (query.length === 0) return;

    axios
      .get(`/api/user/searchName?query=${query}`)
      .then((res) => {
        var newIdMap = {};

        for (let userData of res.data) newIdMap[userData.name] = userData.id;

        setIdMap(newIdMap);
        setOptions(res.data.map((user) => user.name));
      })
      .catch(useErrorAlert);
  }, [query]);

  function onInputChange(e) {
    setQuery(e.target.value);
    setInputValue(e.target.value);
  }

  function onChange(option) {
    if (props.onChange) props.onChange(idMap[option.target.textContent]);
    setInputValue("");
  }

  return (
    <Autocomplete
      options={matchingOptions}
      onInputChange={onInputChange}
      onChange={onChange}
      renderInput={(params) => <TextField {...params} label={props.placeholder} />}
    />
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
      classes={{ preview: "md-content" }}
      generateMarkdownPreview={(markdown) =>
        Promise.resolve(
          <ReactMarkdown renderers={basicRenderers()} source={markdown} />
        )
      }
    />
  );
}
