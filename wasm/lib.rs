use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn urlpattern_parse(input: JsValue, base_url: Option<String>) -> Result<JsValue, JsValue> {
    let input = input.into_serde().unwrap();
    let init = urlpattern::quirks::process_construct_pattern_input(input, base_url.as_deref())
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let pattern = urlpattern::quirks::parse_pattern(init).map_err(|e| e.to_string())?;

    Ok(JsValue::from_serde(&pattern).unwrap())
}

#[wasm_bindgen]
pub fn urlpattern_process_match_input(
    input: JsValue,
    base_url: Option<String>,
) -> Result<JsValue, JsValue> {
    let input = input.into_serde().unwrap();
    let res = urlpattern::quirks::process_match_input(input, base_url.as_deref())
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let (input, inputs) = match res {
        Some((input, inputs)) => (input, inputs),
        None => return Ok(JsValue::NULL),
    };

    Ok(JsValue::from_serde(
        &urlpattern::quirks::parse_match_input(input).map(|input| (input, inputs)),
    )
    .unwrap())
}
