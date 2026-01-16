import React, { useState, useReducer, useRef, useEffect } from "react";
import { ChromePicker } from "react-color";
import ReactMde from "react-mde";
import axios from "axios";

import CustomMarkdown from "components/CustomMarkdown";
import { useOnOutsideClick } from "./Basic";
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
  MenuItem,
  Button,
  IconButton,
  Stack,
  FormControlLabel,
  Typography,
  Checkbox,
  Box,
  FormControl,
  InputLabel,
  FormHelperText,
  Paper,
  Tooltip,
  Slider,
} from "@mui/material";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

const UNGROUPED_NAME = "__UNGROUPED__";

function FormField({
  children,
  field,
  deps,
  compact = false,
  forceSeparateLabel = false,
  useFormControl = false,
  additionalButtons = <></>,
}) {
  const separateLabel =
    forceSeparateLabel || (field.type !== "boolean" && !compact);
  const isUnsaved =
    deps !== undefined && deps[field.saveBtnDiffer] !== field.value;

  const unsavedIndicator = (
    <>
      {field.saveBtn && isUnsaved && (
        <Tooltip title="You have unsaved changes">
          <i
            className="fas fa-dot-circle"
            style={{ color: "var(--mui-palette-primary-main)" }}
          />
        </Tooltip>
      )}
    </>
  );

  const buttons = (
    <>
      {field.saveBtn && isUnsaved && (
        <Button variant="text" onClick={saveBtnOnClick}>
          {field.saveBtn}
        </Button>
      )}
      {field.clearBtn && field.value && (
        <Button variant="text" onClick={clearBtnOnClick}>
          {field.clearBtn}
        </Button>
      )}
      {additionalButtons}
    </>
  );

  function saveBtnOnClick(e) {
    let conf = !field.confirm || window.confirm(field.confirm);

    if (conf) {
      if (field.saveBtnOnClick) field.saveBtnOnClick(field.value, deps);
      else onChange(e, field);
    }
  }

  function clearBtnOnClick(e) {
    if (field.clearBtnOnClick) {
      field.clearBtnOnClick(deps);
    }
  }

  return (
    <Stack direction="column" spacing={0.5}>
      {separateLabel && !useFormControl && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            "& .MuiButton-root": {
              p: 0,
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              lineHeight: 1,
              mt: "var(--mui-spacing) !important",
            }}
          >
            {field.label}
          </Typography>
          {unsavedIndicator}
          {buttons}
        </Stack>
      )}
      <Stack
        direction="column"
        sx={{
          position: "relative",
        }}
      >
        {!useFormControl && children}
        {useFormControl && (
          <FormControl>
            {separateLabel && (
              <InputLabel htmlFor={field.ref}>{field.label}</InputLabel>
            )}
            {children}
            <FormHelperText>{field.extraInfo}</FormHelperText>
          </FormControl>
        )}
      </Stack>
    </Stack>
  );
}

export default function Form({
  onChange,
  fields,
  deps,
  submitText,
  onSubmit,
  sx,
  compact = false,
}) {
  function onFieldChange(event, field, localOnly) {
    let value =
      field.type === "boolean" ? event.target.checked : event.target.value;

    if (field.onChange) {
      field.onChange(event);
    }

    onChange({
      ref: field.ref,
      prop: "value",
      value: value,
      localOnly,
    });
  }

  // Group fields together
  const formFieldGroups = fields.reduce((accumulator, field) => {
    const groupName = field.groupName || UNGROUPED_NAME;
    if (accumulator[groupName] === undefined) {
      accumulator[groupName] = [];
    }
    accumulator[groupName].push(field);
    return accumulator;
  }, {});

  const groupedFormFields = Object.keys(formFieldGroups).map((group) => {
    const formFields = formFieldGroups[group].map((field) => {
      const disabled =
        typeof field.disabled == "function"
          ? field.disabled(deps)
          : field.disabled;
      var showIf;

      if (typeof field.showIf == "string") showIf = [field.showIf];
      else showIf = field.showIf;

      if (Array.isArray(showIf)) {
        for (let ref of showIf) {
          let inverted = ref[0] === "!";

          if (inverted) ref = ref.slice(1);

          for (let field of fields) {
            if (field.ref === ref && field.type === "boolean") {
              let value = field.value === true;

              if ((value ^ inverted) === 0) return;

              break;
            }
          }
        }
      } else if (typeof showIf == "function") if (!showIf(deps)) return;

      const value =
        typeof field.value == "function" ? field.value(deps) : field.value;

      switch (field.type) {
        case "text":
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
            >
              {field.type === "text" && field.textStyle === "large" ? (
                <TextField
                  multiline
                  rows={3}
                  defaultValue={value || ""}
                  placeholder={field.placeholder}
                  disabled={disabled}
                  onChange={(e) =>
                    !field.fixed && onFieldChange(e, field, field.saveBtn)
                  }
                  onClick={(e) => field.highlight && e.target.select()}
                  helperText={field.extraInfo}
                  label={compact ? field.label : undefined}
                />
              ) : (
                <TextField
                  defaultValue={value || ""}
                  placeholder={field.placeholder}
                  disabled={disabled}
                  onChange={(e) =>
                    !field.fixed && onFieldChange(e, field, field.saveBtn)
                  }
                  onClick={(e) => field.highlight && e.target.select()}
                  helperText={field.extraInfo}
                  label={compact ? field.label : undefined}
                />
              )}
            </FormField>
          );
        case "emoteUpload":
          const yourEmotes = Object.keys(value).map((key) => (
            <Paper
              variant="outlined"
              key={key}
              sx={{
                p: 0.5,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <div
                  className="emote"
                  title={key}
                  style={{
                    backgroundImage: `url('/${value[key].path}')`,
                  }}
                />
                <Typography sx={{ flex: "1" }}>{key}</Typography>
                <IconButton
                  onClick={() => field.onCustomEmoteDelete(value[key].id, deps)}
                >
                  <i className="fas fa-trash" />
                </IconButton>
              </Stack>
            </Paper>
          ));
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
            >
              <Stack direction="column" spacing={1}>
                <EmoteUpload
                  id="emote-upload"
                  disabled={disabled}
                  deps={deps}
                  field={field}
                />
                <Stack direction="column">
                  <Typography variant="caption">Your Custom Emotes</Typography>
                  <Stack direction="column" spacing={1}>
                    {yourEmotes}
                  </Stack>
                </Stack>
              </Stack>
            </FormField>
          );
        case "number":
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
            >
              <TextField
                type="number"
                defaultValue={field.value || "0"}
                step={field.step}
                disabled={disabled}
                onChange={(e) => onFieldChange(e, field)}
                helperText={field.extraInfo}
                label={compact ? field.label : undefined}
                slotProps={{
                  htmlInput: {
                    min: field.min,
                    max: field.max,
                  },
                }}
              />
            </FormField>
          );
        case "boolean":
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
            >
              <FormControlLabel
                label={field.label}
                control={
                  <Checkbox
                    defaultChecked={field.value || false}
                    disabled={disabled}
                    onChange={(e) => onFieldChange(e, field)}
                  />
                }
              />
            </FormField>
          );
        case "select":
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
            >
              <TextField
                select
                defaultValue={field.value || field.options[0].ref}
                disabled={disabled}
                onChange={(e) => onFieldChange(e, field)}
                helperText={field.extraInfo}
                label={compact ? field.label : undefined}
              >
                {field.options.map((option) => (
                  <MenuItem value={option.value} key={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </FormField>
          );
        case "range":
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
              forceSeparateLabel
            >
              <Paper sx={{ px: 2 }}>
                <Stack
                  direction="column"
                  sx={{
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Slider
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={field.value}
                    disabled={disabled}
                    onChange={(e) => onFieldChange(e, field)}
                    helperText={field.extraInfo}
                    label={compact ? field.label : undefined}
                  />
                </Stack>
              </Paper>
            </FormField>
          );
        case "color":
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
              additionalButtons={
                <>
                  {!field.noReset &&
                    field.value !== field.default &&
                    field.value && (
                      <Button
                        variant="text"
                        onClick={() =>
                          onFieldChange(
                            { target: { value: field.default } },
                            field
                          )
                        }
                      >
                        Reset
                      </Button>
                    )}
                </>
              }
            >
              <ColorPicker
                value={field.value}
                default={field.default}
                alpha={field.alpha}
                disabled={disabled}
                onChange={(e) => onFieldChange(e, field)}
                fieldRef={field.ref}
              />
            </FormField>
          );
        case "date":
          if (field.value === "undefined") {
            field.value = undefined;
          }

          let selectedValue = deps.user[field.ref];
          if (selectedValue === "undefined") {
            selectedValue = undefined;
          }

          // Convert date to YYYY-MM-DD format for HTML5 date input
          const formatDateForInput = (date) => {
            if (!date) return "";
            const d = new Date(date);
            if (isNaN(d.getTime())) return "";
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          };

          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
            >
              <input
                type="date"
                value={formatDateForInput(field.value || selectedValue)}
                disabled={disabled}
                onChange={(e) => onFieldChange(e, field, true)}
              />
              <FormHelperText>{field.extraInfo}</FormHelperText>
            </FormField>
          );
        case "datetime-local": {
          return (
            <FormField
              field={field}
              deps={deps}
              compact={compact}
              key={field.ref}
              useFormControl
            >
              <input
                type="datetime-local"
                min={dateToHTMLString(field.min)}
                max={dateToHTMLString(field.max)}
                value={dateToHTMLString(field.value)}
                disabled={disabled}
                onChange={(e) => onFieldChange(e, field)}
              />
              <FormHelperText>{field.extraInfo}</FormHelperText>
            </FormField>
          );
        }
        case "custom":
          // Custom field type - render children if provided, otherwise nothing
          if (field.render) {
            return (
              <FormField
                field={field}
                deps={deps}
                compact={compact}
                key={field.ref}
              >
                {field.render(deps)}
              </FormField>
            );
          }
          return null;
        default: {
          throw Error(`Unknown Form.jsx input type ${field.type}`);
        }
      }
    });

    return (
      <Stack direction="column" spacing={1}>
        {group !== UNGROUPED_NAME && (
          <Typography
            variant="h1"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              pt: 1,
            }}
          >
            {group}
          </Typography>
        )}
        {formFields}
      </Stack>
    );
  });

  return (
    <Stack
      className="form"
      direction="column"
      spacing={1}
      sx={{
        ...sx,
        "& .MuiCheckbox-root": {
          p: compact ? 0 : undefined,
          mx: compact ? 1 : undefined,
        },
      }}
    >
      {groupedFormFields}
      {submitText && <Button onClick={onSubmit}>{submitText}</Button>}
    </Stack>
  );
}

function ColorPicker(props) {
  const value = props.value || props.default;
  const disabled = props.disabled;

  function onChangeComplete(event) {
    const color = event.target.value;
    props.onChange({ target: { value: color } });
  }

  return (
    <input
      type="color"
      value={value}
      disabled={disabled}
      onChange={onChangeComplete}
    />
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
        <Stack direction="column">
          <Typography variant="caption">Preview</Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 0.5,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
              }}
            >
              <div
                className="emote"
                title={this.state.emoteText}
                style={{
                  backgroundImage: `url('${this.state.imageURI}')`,
                }}
              />
              <Typography>:{this.state.emoteText}:</Typography>
              <Button
                size="small"
                sx={{
                  alignSelf: "center",
                  marginLeft: "auto !important",
                }}
                onClick={(e) => {
                  this.setState({
                    emoteText: "",
                    imageURI: null,
                    imageFilename: null,
                    imageMimeType: null,
                  });
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
              </Button>
            </Stack>
          </Paper>
        </Stack>
      );
    } else {
      return <></>;
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
      <Stack direction="column" spacing={1}>
        <Stack direction="row" spacing={1}>
          <TextField
            placeholder="your emote name here"
            maxlength={25}
            disabled={this.props.disabled}
            onChange={this.updateEmoteText.bind(this)}
            sx={{
              flex: "1",
            }}
          />
          <Stack
            direction="column"
            sx={{
              flex: "1",
              minWidth: 0,
            }}
          >
            <Button
              component="label"
              htmlFor={this.state.id}
              sx={{
                flex: "1",
              }}
            >
              Upload
            </Button>
            <input
              id={this.state.id}
              style={{ visibility: "hidden", height: "0" }}
              type="file"
              onChange={this.handleChange.bind(this)}
            />
          </Stack>
        </Stack>
        {preview}
      </Stack>
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
            case "setFields": {
              newFormFields = action.fields;
              break;
            }
            default: {
              throw Error("Unknown action: " + action.type);
            }
          }
        } else if (field.ref && field.ref === action.ref) {
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
      renderInput={(params) => (
        <TextField {...params} label={props.placeholder} />
      )}
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
        Promise.resolve(<CustomMarkdown>{markdown}</CustomMarkdown>)
      }
    />
  );
}
