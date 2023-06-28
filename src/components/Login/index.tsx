import { FormEvent, useRef, useState } from "react"
import { Helmet, HelmetProvider }                 from "react-helmet-async"
import { useSearchParams }                  from "react-router-dom"
import useFetch                                   from "../../hooks/useFetch"

import logo from "../../assets/images/logo.svg";

import "./Login.css";

export default function Login() {

    const [searchParams] = useSearchParams();
    const [id, setId]    = useState("")
    const [password, setPassword]    = useState("")
    const [error, setError]    = useState<Error | undefined>()

    const loginType = String(searchParams.get("login_type") || "")
    const aud       = String(searchParams.get("aud") || "")
    const patient   = String(searchParams.get("patient" ) || "").trim().split(/\s*,\s*/).filter(Boolean)
    const provider  = String(searchParams.get("provider") || "").trim().split(/\s*,\s*/).filter(Boolean)

    const submitButton = useRef<HTMLButtonElement>(null);

    let url;
    if (loginType === "provider") {
        url = new URL(aud + "/Practitioner?_count=10&_summary=true&_sort=given")
        if (provider.length) url.searchParams.set("_id", provider.join(","))
    }
    else {
        url = new URL(aud + "/Patient?_count=10&_summary=true&_sort=given")
        if (patient.length) url.searchParams.set("_id", patient.join(","))
    }

    const fetchUrl = url.href

    const { data: bundle, loading } = useFetch<fhir4.Bundle<fhir4.Patient|fhir4.Practitioner>>(fetchUrl, {
        headers: {
            authorization: `Bearer ${window.ENV.ACCESS_TOKEN}`
        }
    })
    const recs    = bundle?.entry?.map(e => e.resource!) || []
    const noData  = (!loading && !recs.length)
    const firstID = recs[0]?.id

    async function submit(e: FormEvent) {
        e.preventDefault()
        try {
            const url = new URL(searchParams.get("aud")!.replace(/\/fhir/, "/auth/login"))
            const body = new URLSearchParams();
            body.set('username', id);
            body.set('password', password);
            body.set('loginType', loginType);
            const response = await fetch(url, {method: "POST", body});
            const result = await response.json()
            if(response.ok) {
                //add this to searchparams
            } else {
                return setError(result as Error);
            }
        } catch(error: unknown) {
            return setError(error as Error);
        }

        const url = new URL(searchParams.get("aud")!.replace(/\/fhir/, "/auth/authorize"))
        url.search = window.location.search
        url.searchParams.set("login_success", "1")

        // FIXME: Uses the credentials of the first available practitioner or patient to login.
        if (loginType === "provider") {
            url.searchParams.set("provider", firstID as string)
        } else {
            url.searchParams.set("patient", firstID as string)
        }

       window.top?.postMessage({
           type: "setUser",
           payload: recs.find((rec) => rec.id === firstID),
       }, window.location.origin);

        window.location.href = url.href;
    }

    //useEffect(() => {
    //    if (firstID) {
    //        setId(firstID)
    //        setTimeout(() => submitButton.current!.focus(), 0);
    //    }
    //}, [firstID])

    return (
        <HelmetProvider>
            <Helmet>
                <title>SMART Launcher - { loginType === "provider" ? "Practitioner" : "Patient" } Login</title>
            </Helmet>
            <div className="login-container">
                <div className="login-banner">
                    <img className="login-logo" src={logo} alt="" />
                </div>
                <div className="login-content">
                    <div className="login-form">
                        <h2>
                            { loginType === "provider" ? "Practitioner " : "Patient " } Login
                        </h2>
                        <p>
                            Please enter your username and password.
                        </p>
                        {noData && (
                            <div className="alert alert-danger">
                                <h5><i className="glyphicon glyphicon-exclamation-sign" /> No { loginType === "provider" ? "Providers" : "Patients"} Found!</h5>
                                <small>Continue without a user, or return to the launch screen to include additional data.</small>
                            </div>
                        )}
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" className="form-control" onChange={e => setId(e.target.value)} />
                            {/*
                            <select className="form-control" value={id} onChange={e => setId(e.target.value)}>
                               <option value="">Please Select</option>
                                   { recs.map((rec, i) => (
                                       <option value={rec.id} key={i}>{ humanName(rec) }</option>
                                   )) }
                            </select>
                              */}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input type="password" className="form-control" onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div className="form-group">
                            {error && <div className="alert alert-danger">{error.message}</div>}
                            <div className="text-center">
                                <button
                                    type="button"
                                    className="btn btn-primary login-button"
                                    onClick={submit}
                                    disabled={!id}
                                    ref={submitButton}
                                >
                                    {noData ? "Continue Without User" : "Login"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    )
}
