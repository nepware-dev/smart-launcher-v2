import { FormEvent, useRef, useState }            from "react"
import { Helmet, HelmetProvider }                 from "react-helmet-async"
import { useSearchParams, Link }                  from "react-router-dom"
import useFetch                                   from "../../hooks/useFetch"

import logo from "../../assets/images/logo.svg";

import "./Register.css";

export default function Register() {

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
                <title>SMART Launcher - Create an account</title>
            </Helmet>
            <div className="register-container">
                <div className="register-banner">
                    <img className="register-logo" src={logo} alt="" />
                </div>
                <div className="register-content">
                    <div className="register-form">
                        <div>
                            <h2>Create an account</h2>
                            <p>Please enter your details.</p>
                        </div>
                        <div className="form-row">
                            <p className="form-row-title">Contact details</p>
                            <div className="form-input-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input type="text" className="form-control" onChange={e => setId(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input type="text" className="form-control" onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <input type="text" className="form-control" />
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <p className="form-row-title">Address</p>
                            <div className="form-input-row">
                                <div className="form-group">
                                    <label>Country</label>
                                    <input type="text" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input type="text" className="form-control" />
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <p className="form-row-title">Account</p>
                            <div className="form-input-row">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input type="text" className="form-control" onChange={e => setId(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" className="form-control" onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Re-enter Password</label>
                                    <input type="password" className="form-control" />
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            {error && <div className="alert alert-danger">{error.message}</div>}
                            <button
                                type="button"
                                className="btn btn-primary button"
                                onClick={submit}
                                disabled={!id}
                                ref={submitButton}
                            >
                                {noData ? "Continue Without User" : "Create Account"}
                            </button>
                            <div>
                                Already have an account? <Link replace to={`/patient-login?${searchParams}`}>Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    )
}
