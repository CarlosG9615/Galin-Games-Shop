import './InputBox.scss';

function InputBox({ ocultarLabel, ...props }){
    console.log(`valores recibidos desde el componente padre: ${JSON.stringify(props)}`);
    // El título se ve siempre, excepto en contraseña: el valor va enmascarado
    // (puntos), así que el placeholder ya es suficiente y el título nunca aporta.
    const ocultarLabelVisualmente = ocultarLabel || props.typeInput === 'password';
    return(
        <div className="mb-2">
            <label
                htmlFor={props.nameInput}
                className={`form-label texto-tema texto-tema--tenue${ocultarLabelVisualmente ? ' visualmente-oculto' : ''}`}>{props.labelInput}
            </label>
            <input
                type={props.typeInput}
                className="form-control"
                id={props.nameInput}
                // placeholder={`Introduce tu ${props.nameInput}...`}
                placeholder={props.placeholderInput}
                value={props.value}
                disabled={props.disabled}
                onChange={props.eventoOnChange} required={props.required !== false} />
        </div>
    )

}
export default InputBox;